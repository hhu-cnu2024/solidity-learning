# @version ^0.3.0
# @license MIT
INIT_REWARD: constant(uint256) = 1*10**18
interface IMyToken:
    def transfer(_amount:uint256,_to:address) : nonpayable
    def transferFrom(_owner:address, _to : address, _amount:uint256):nonpayable # api 파라미터 순서도 잘 생각하자
    def mint(_amount:uint256,_to:address):nonpayable
    

event Staked:
    _owner: indexed(address)
    _amount: uint256
event Withdraw:
    _amount: uint256
    _to: indexed(address)
event SetRewardPerBlock:
    _amount: uint256
    
staked: public(HashMap[address, uint256])
totalStaked: public(uint256)
managers : public(address[5])
BMN : public(uint256)

stakingToken:IMyToken

rewardPerBlock: uint256

lastClaimedBlock: HashMap[address, uint256]
owner: address
manager: address
confirmed: public(bool[5])

@internal
@view
def allConfirmed() -> bool:
    for i in range(5):
        if not self.confirmed[i]:
            return False
    return True


@internal
def reset():
    for i in range(5):  # confirmed is bool[5]
        self.confirmed[i] = False
@external
def confirm():
    found:bool = False
    for i in range(5):
        if self.managers[i] == msg.sender:
            found = True
            self.confirmed[i] = True
            break
    assert found, "You are not a manager"



    

@internal # vyper는 internal에서 msg.sender에 접근 불가
def onlyOwner(_owner:address):
    assert self.owner == _owner, "You are not authorized"

@internal # vyper는 internal에서 msg.sender에 접근 불가
def onlyManager(_manager:address):
    assert self.manager == _manager, "You are not authorized to manage this contract"
@external
def __init__(_stakingToken:IMyToken,_managers: address[5], _BMN: uint256):
    self.stakingToken = _stakingToken
    self.managers = _managers
    self.BMN = _BMN
    for i in range(5):
        self.confirmed[i] = False
    self.rewardPerBlock = INIT_REWARD # 상수처리해서 다르게 저장되었다 위치도 다르다. storage와 상수의 저장차이
    self.owner = msg.sender
    self.manager = msg.sender

@internal
def onlyAllConfirmed():
    assert self.allConfirmed(), "Not all confirmed yet"
    self.reset()

@external
def setRewardPerBlock(_amount: uint256):
    self.onlyAllConfirmed()
    self.onlyOwner(msg.sender)
    self.rewardPerBlock = _amount
    log SetRewardPerBlock(_amount)


@internal
def updateReward(_to: address):
    if self.staked[_to] >0:
        blocks: uint256 =  block.number- self.lastClaimedBlock[_to]
        reward: uint256 = self.rewardPerBlock * blocks * self.staked[_to] / self.totalStaked
        self.stakingToken.mint(reward, _to)
    self.lastClaimedBlock[_to] = block.number 

@external
def stake(_amount: uint256):
    assert _amount> 0, " cannot stake 0 amount"
    self.updateReward(msg.sender)
    self.stakingToken.transferFrom(msg.sender, self,_amount)
    self.staked[msg.sender] +=_amount
    self.totalStaked += _amount
    log Staked(msg.sender, _amount)
@external
def withdraw(_amount: uint256):
    assert self.staked[msg.sender] >= _amount, "insufficient staked token"
    self.updateReward(msg.sender)
    self.stakingToken.transfer(_amount, msg.sender)
    self.staked[msg.sender] -= _amount
    self.totalStaked -= _amount
    log Withdraw(_amount,msg.sender)

