// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IERC20
 * Minimal interface for ERC20 token interactions.
 */
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

/**
 * @title Escrow
 * @dev A smart contract acting as a trustless escrow for the MicroTask platform.
 */
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

contract Escrow is ReentrancyGuard {
    address public admin;

    enum TaskState { OPEN, CLAIMED, IN_REVIEW, COMPLETED, DISPUTED, REFUNDED }

    struct Task {
        uint256 id;
        address publisher;
        address performer;
        address token;
        uint256 amount;
        TaskState state;
    }

    mapping(uint256 => Task) public tasks;

    event TaskCreated(uint256 indexed taskId, address indexed publisher, address token, uint256 amount);
    event TaskApproved(uint256 indexed taskId, address indexed performer, uint256 amount);
    event TaskRefunded(uint256 indexed taskId, address indexed publisher);
    event TaskDisputed(uint256 indexed taskId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    modifier onlyPublisher(uint256 _taskId) {
        require(tasks[_taskId].publisher == msg.sender, "Only publisher can call this");
        _;
    }

    modifier inState(uint256 _taskId, TaskState _state) {
        require(tasks[_taskId].state == _state, "Invalid task state");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Publisher creates a task and deposits the bounty amount into the contract.
     * Requires prior approval (approve) for this contract to spend Publisher's tokens.
     */
    function depositForTask(uint256 _taskId, uint256 _amount, address _token) external nonReentrant {
        require(tasks[_taskId].id == 0, "Task already exists");
        require(_amount > 0, "Amount must be greater than zero");
        
        // Transfer tokens from publisher to this contract
        require(IERC20(_token).transferFrom(msg.sender, address(this), _amount), "Token transfer failed");

        tasks[_taskId] = Task({
            id: _taskId,
            publisher: msg.sender,
            performer: address(0),
            token: _token,
            amount: _amount,
            state: TaskState.OPEN
        });

        emit TaskCreated(_taskId, msg.sender, _token, _amount);
    }

    /**
     * @dev Publisher approves the submitted work, releasing funds to the Performer.
     */
    function releaseFunds(uint256 _taskId, address _worker) external onlyPublisher(_taskId) nonReentrant {
        Task storage taskData = tasks[_taskId];
        require(taskData.state == TaskState.OPEN || taskData.state == TaskState.IN_REVIEW || taskData.state == TaskState.CLAIMED, "Task cannot be approved in current state");
        require(_worker != address(0), "Invalid worker address");

        taskData.performer = _worker;
        taskData.state = TaskState.COMPLETED;

        // Transfer funds to the worker
        require(IERC20(taskData.token).transfer(_worker, taskData.amount), "Token transfer failed");

        emit TaskApproved(_taskId, _worker, taskData.amount);
    }

    /**
     * @dev Publisher requests a refund. 
     * In a production environment, this should include a deadline check so publishers can't just refund at any time.
     */
    function refundTask(uint256 _taskId) external onlyPublisher(_taskId) nonReentrant {
        Task storage taskData = tasks[_taskId];
        require(taskData.state == TaskState.OPEN, "Can only refund OPEN tasks");

        taskData.state = TaskState.REFUNDED;

        // Return funds to publisher
        require(IERC20(taskData.token).transfer(msg.sender, taskData.amount), "Token transfer failed");

        emit TaskRefunded(_taskId, msg.sender);
    }

    /**
     * @dev Locks the funds and transfers control to the admin for arbitration.
     * Can be called by either the publisher or the platform admin.
     */
    function disputeTask(uint256 _taskId) external {
        Task storage taskData = tasks[_taskId];
        require(msg.sender == taskData.publisher || msg.sender == admin, "Unauthorized");
        require(taskData.state != TaskState.COMPLETED && taskData.state != TaskState.REFUNDED, "Task already finalized");

        taskData.state = TaskState.DISPUTED;
        
        emit TaskDisputed(_taskId);
    }

    /**
     * @dev Admin resolves a dispute, routing the funds to the correct party (or splitting).
     */
    function resolveDispute(uint256 _taskId, address _winner, uint256 _amount) external onlyAdmin nonReentrant {
        Task storage taskData = tasks[_taskId];
        require(taskData.state == TaskState.OPEN || taskData.state == TaskState.CLAIMED || taskData.state == TaskState.IN_REVIEW || taskData.state == TaskState.DISPUTED, "Task finalized");
        require(_amount <= taskData.amount, "Amount exceeds locked balance");

        taskData.state = TaskState.COMPLETED;
        require(IERC20(taskData.token).transfer(_winner, _amount), "Token transfer failed");
    }
}
