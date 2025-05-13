//Token : smart contract based (native와 다르지만, 비슷하게 움직일 수 있다.)
//BTC,ETH, XRP, KAIA : native token 만약 비트코인 네트워크에서 트렌젝션을
// 만들어서 그 트렌젝션을 처리하기위한 수수료를 내야하고 그걸 비트코인으로만 받아준다.

//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ManagedAccess.sol";
import "./MultiManagedAccess.sol";

//모듈화 유지보수

contract MyToken is
    MultiManagedAccess //상속을 이용함
{
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed spender, uint256 amount);
    //위에 문자열들을 그냥 해싱 해버린다. 그렇게 한걸 topic에 보여주고, 영수증에 이벤트가 찍힌다.
    string public name;
    string public symbol;
    uint8 public decimals; //1 wei --> 1*10^-18 ETH uint8 -->8 bit unsigned int

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // state

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _amount,
        address[] memory _managers,
        uint _BMN
    ) MultiManagedAccess(msg.sender, _managers, msg.sender, _BMN) {
        //super() 상위클래스의 생성자
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        _mint(_amount * 10 ** uint256(decimals), msg.sender); //transaction에 from에 해당하는 발행자에 바로 접근함
    }

    function approve(address spender, uint256 amount) external {
        allowance[msg.sender][spender] = amount;
        emit Approval(spender, amount);
    }

    function transferFrom(address from, address to, uint256 amount) external {
        address spender = msg.sender;
        require(allowance[from][spender] >= amount, "insufficient allowance");
        allowance[from][spender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }

    //TTD에 맞게 바꾸기
    function _mint(uint256 amount, address to) internal {
        totalSupply += amount;
        balanceOf[to] += amount;

        emit Transfer(address(0), to, amount);
    }

    function mint(uint256 amount, address to) external onlyManager {
        _mint(amount, to);
    }

    function setManager(address _manager) external onlyOwner {
        manager = _manager;
    }

    function transfer(uint256 amount, address to) external {
        // 새로운 함수를 만들면 compile
        require(balanceOf[msg.sender] >= amount, "insufficient balance");
        //조건과 예외처리..?
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
    }

    //public으로 필드를 만들면 기본적으로 getter가 만들어진다.
    // function totalSupply() external view returns (uint256) {
    //     return totalSupply;
    // }
    // function name() external view returns (string){
    //     return name;
    // }
    /*
    approve
     - allow spender address to send my token
    transferFrom
     - spender : owner -> target address
     
    */
}
