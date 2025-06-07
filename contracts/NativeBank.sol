// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract NativeBank {
    mapping(address => uint256) public balanceOf;
    bool lock;
    modifier noreentrancy() {
        require(!lock, "is now working on");
        lock = true;
        _;
        lock = false;
    }

    function withdraw() external noreentrancy {
        /*require(!lock, "is now working on");
        lock = true;//withdraw시작할때 락걸기*/
        uint256 balance = balanceOf[msg.sender]; // balance를 여기 저장해놨으니까 balanceOf를 0으로 만들어도, 송금하는 금액에 문제가 없다.
        // 따라서 balace를 저장하자마자 잔고를 빠르게 털어서 재호출이 안되게 걸자
        //아님 락을 걸자 그러면 트렌젝션을 다시보내는 코드인 bool success부분에서 false가 나오므로, failed to send native token에러가 난다.
        require(balance > 0, "insufficient balance");
        (bool success, ) = msg.sender.call{value: balance}(""); //return type, call은 smartcontract에서 트렌젝션을 생성하고, 보내는방법,from: 특이한 구조,
        //그리고 트렌젝션으로 처리는 안됨. 로그로 남은 Message Call 따라서 로그로 분석
        //트렌젝션의 결과가 반환될때까지 기다리다가 주도권또 넘어감 reentrancy : 재진입
        //call의 from : this, to : msg.sender
        require(success, "failed to send native token");

        balanceOf[msg.sender] = 0;
        /* lock = false;// 락풀기*/
    }

    receive() external payable {
        balanceOf[msg.sender] += msg.value;
    } //예약function이라서 앞에 function이 안붙는다. payable
}
