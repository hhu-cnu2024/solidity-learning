# @version ^0.3.0
# @license MIT

#file 한개가 그냥 contract하나다 따라서 contract를 명시할 필요없다.
event Transfer:
    owner : indexed(address)
    to : indexed(address)
    amount: uint256

event Approval:
    spender: indexed(address)
    amount: uint256

owner: address
manager: address
name: public(String[64]) #state 선언후 타입을 명시해야함
symbol: public(String[32])
decimals: public(uint256)
totalSupply: public(uint256) #camelcase(totalSupply)/ snakecase (total_Supply)
managers : public(address[5])
BMN : public(uint256)

balanceOf: public(HashMap[address, uint256])
allowance: public(HashMap[address,HashMap[address, uint256]])
#modifier를 만들었는데, 파이썬이니까 순서도 중요함
@internal # vyper는 internal에서 msg.sender에 접근 불가
def onlyOwner(_owner:address):
    assert self.owner == _owner, "You are not authorized"
    
@internal
def onlyManager(_manager:address):
    assert self.manager == _manager, "You are not authorized to manage this contract"

#derective?
@external
def __init__(_name: String[64], _symbol: String[32], _decimals: uint256, _initialSupply: uint256, _managers: address[5], _BMN: uint256):
    self.name = _name
    self.symbol = _symbol
    self.decimals = _decimals
    self.totalSupply = _initialSupply * 10 ** 18
    self.managers = _managers
    self.BMN = _BMN
    self.balanceOf[msg.sender] += _initialSupply * 10 **18
    self.owner = msg.sender
    self.manager = msg.sender

@external
def transfer(_amount:uint256, _to:address):
    assert self.balanceOf[msg.sender]>= _amount, "insufficient balance"
    self.balanceOf[msg.sender] -= _amount
    self.balanceOf[_to]+= _amount
    #트렌젝션(컨트렉트의 함수)를 만든 지갑의 주소 msg.sender
    log Transfer(msg.sender,_to,_amount)
@external
def approve(_spender: address, _amount:uint256):
    self.allowance[msg.sender][_spender] += _amount
    log Approval(_spender, _amount)
@external
def transferFrom(_owner: address, _to:address, _amount:uint256):
    assert self.allowance[_owner][msg.sender] >= _amount, "insufficient allowance"
    assert self.balanceOf[_owner] >=_amount, "insufficient balance"
    self.balanceOf[_owner] -= _amount
    self.balanceOf[_to] +=_amount
    self.allowance[_owner][msg.sender]-= _amount
    log Transfer(_owner,_to,_amount)
    
@internal
def _mint(_amount: uint256, _to: address):
    self.balanceOf[_to] += _amount
    self.totalSupply += _amount

    log Transfer(ZERO_ADDRESS,_to,_amount) #누가 누구에게 줬다고 하기기 힘듬 free defined constants

@external
def mint(_amount: uint256, _to : address):
    self.onlyManager(msg.sender)
    self._mint(_amount, _to)

@external
def setManager(_manager: address):
    self.onlyOwner(msg.sender)
    self.manager = _manager
    

    
