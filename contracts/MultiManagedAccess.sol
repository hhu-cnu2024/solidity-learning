//SPDX-License-Identifier:MIT
pragma solidity ^0.8.28;

abstract contract MultiManagedAccess {
    //uint constant MANAGER_NUMBERS = 5;
    uint immutable BACKUP_MANAGER_NUMBERS;

    address public owner;
    address[] public managers;

    bool[] public confirmed;

    // manager0 --> confirmed0
    // manager1 --> confirmed1
    //...

    address public manager;

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not authorized");
        _;
    }
    modifier onlyManager() {
        require(
            msg.sender == manager,
            "You are not authorized to manage this contract" // 일반적 메세지(가스비)
        );
        _;
    }

    constructor(
        address _owner,
        address[] memory _managers,
        address _manager,
        uint _manager_numbers
    ) {
        require(_managers.length == _manager_numbers, "size unmatched");
        owner = _owner;
        BACKUP_MANAGER_NUMBERS = _manager_numbers;

        for (uint i = 0; i < _manager_numbers; i++) {
            managers.push(_managers[i]); //solidity는 레퍼런스 복사없이 그냥 깊은복사해야함
            confirmed.push(false);
            //solidity array는 dynamic array
        }
        manager = _manager;
    }

    // read만 하는 function이므로 view를 해줬다 return값 명시
    function allConfirmed() internal view returns (bool) {
        for (uint i = 0; i < BACKUP_MANAGER_NUMBERS; i++) {
            if (!confirmed[i]) {
                return false;
            }
        }
        return true;
    }

    function reset() internal {
        for (uint i = 0; i < BACKUP_MANAGER_NUMBERS; i++) {
            confirmed[i] = false;
        }
    }

    modifier onlyAllConfirmed() {
        require(allConfirmed(), "Not all confirmed yet");
        reset();
        _;
    }

    function confirm() external {
        bool found = false;
        for (uint i = 0; i < BACKUP_MANAGER_NUMBERS; i++) {
            if (managers[i] == msg.sender) {
                found = true;
                confirmed[i] = true;
                break;
            }
        }
        require(found, "You are not a manager");
    }
}
