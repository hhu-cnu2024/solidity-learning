// 스마트컨트랙트 기반의 예치상품에는 staking이라는 용어를 사용한다
// TinyBank : deposit(Mytoken) 예금,치치 / withdraw(Mytoken) 출금 / vault 금고
// - users toekn management
// - user --> deposiit --> TinyBank --> transfer

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IMyToken {
    function transfer(uint256 amount, address to) external;

    function transferFrom(address from, address to, uint256 amount) external;
} // 생성자에서 자료형 맞춰주기 위함인가?

// 마치 클래스같이 하나의 작업을 해주는 모듈 contract
// constructor : 생성자느낌
contract TinyBank {
    event Staked(address, uint256);

    IMyToken public stakingToken;
    mapping(address => uint256) public staked; // 누가 얼만큼 예치했는지 고객관리 장부;
    uint256 public totalStaked; // 전체 예치금

    constructor(IMyToken _stakingToken) {
        // 토큰의 일반화, 어떤 토큰으로 작동(deposit, withdraw)할건지 정기기
        stakingToken = _stakingToken;
    }

    function stake(uint256 _amount) external {
        require(_amount >= 0, "cannot stake 0 amount");
        // msg.sender는 실행한사람의 주소, address(this)는 이 코드(컨트렉트)의 주소 Contract Address
        // MyToken 내부에서 msg.sender는 signer0
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        staked[msg.sender] += _amount;
        totalStaked += _amount;
        emit Staked(msg.sender, _amount);
    }
}
