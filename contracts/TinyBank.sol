// 스마트컨트랙트 기반의 예치상품에는 staking이라는 용어를 사용한다
// TinyBank : deposit(Mytoken) 예금,예치 / withdraw(Mytoken) 출금 / vault 금고
// - users toekn management
// - user --> deposiit --> TinyBank --> transfer(user --> TinyBank)

//Reward
// - reward token : MyToken
// - reward resources : 1 MT/block mintin예
// - reward stategy : staked[user]/totalStaked distribution

// - signer0 block 0 staking
// - signer1 block 5 staking
// - 0-- 1-- 2-- 3-- 4-- 5--
//   |                   |
// - signer0 10MT        signer1 10MT

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./ManagedAccess.sol";

interface IMyToken {
    function transfer(uint256 amount, address to) external;

    function transferFrom(address from, address to, uint256 amount) external;

    function mint(uint256 amount, address owner) external;
} // 생성자에서 자료형 맞춰주기 위함인가?

// 마치 클래스같이 하나의 작업을 해주는 모듈 contract
// constructor : 생성자느낌
contract TinyBank is ManagedAccess {
    event Staked(address from, uint256 amount);
    event Withdraw(uint256 amount, address to);

    IMyToken public stakingToken;

    mapping(address => uint256) public lastClaimedBlock;
    //address[] public stakedUsers;
    uint256 defaultRewardPerBlock = 1 * 10 ** 18;
    uint256 rewardPerBlock;

    uint256 public totalStaked; // 전체 예치금
    mapping(address => uint256) public staked; // 누가 얼만큼 예치했는지 고객관리 장부;

    constructor(IMyToken _stakingToken) ManagedAccess(msg.sender, msg.sender) {
        // 토큰의 일반화, 어떤 토큰으로 작동(deposit, withdraw)할건지 정기기
        stakingToken = _stakingToken;
        rewardPerBlock = defaultRewardPerBlock;
    }

    // who, when?
    //modifier는 기본이 internal, 함수 호출하듯이 하면 안됨
    modifier updateReward(address to) {
        if (staked[to] > 0) {
            uint256 blocks = block.number - lastClaimedBlock[to];
            uint256 reward = (blocks * rewardPerBlock * staked[to]) /
                totalStaked;
            stakingToken.mint(reward, to);
        }
        lastClaimedBlock[to] = block.number;
        _; // caller's code
    }

    function setRewardPerBlock(uint256 _amount) external onlyManager {
        rewardPerBlock = _amount;
    }

    function stake(uint256 _amount) external updateReward(msg.sender) {
        require(_amount >= 0, "cannot stake 0 amount");
        // msg.sender는 실행한사람의 주소, address(this)는 이 코드(컨트렉트)의 주소 Contract Address
        // MyToken 내부에서 msg.sender는 signer0
        //updateReward(msg.sender);
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        staked[msg.sender] += _amount;
        totalStaked += _amount;
        emit Staked(msg.sender, _amount);
    }

    function withdraw(uint256 _amount) external updateReward(msg.sender) {
        require(staked[msg.sender] >= _amount, "insufficient staked token");
        //updateReward(msg.sender);
        stakingToken.transfer(_amount, msg.sender);
        staked[msg.sender] -= _amount;
        totalStaked -= _amount;
        emit Withdraw(_amount, msg.sender);
    }
}
