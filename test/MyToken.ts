//test파일은 이름을 다 맞추더라
import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("mytoken deploy", () => {
  let myTokenContract: MyToken;
  let signers: HardhatEthersSigner[];
  before("should deploy", async () => {
    signers = await hre.ethers.getSigners();
    myTokenContract = await hre.ethers.deployContract("MyToken", [
      //deployContract할때, (컨트렉트 배포할때), hardhat ethers는 기본적으로 signer0을 선택한다. (signerfield에서 바꿀 수 있다)
      //그리고 transaction은 반드시 서명이 필요하다, 이때, ethers와 다르게 hardhat ethers는 연결된 signer0으로 내부에서 서명하고,
      //트렌젝션 전송하고, 영수증까지 처리한다.(디버깅할때 필요할 수도..)
      "MyToken",
      "MT",
      18,
    ]);
  });
  it("should return name", async () => {
    expect(await myTokenContract.name()).equal("MyToken");
  });
  it("should return symbol", async () => {
    expect(await myTokenContract.symbol()).equal("MT");
  });
  it("should return decimals", async () => {
    expect(await myTokenContract.decimals()).equal(18);
  });
  it("should return 0 totalSupply", async () => {
    expect(await myTokenContract.totalSupply()).equal(1n * 10n ** 18n);
  });
  it("should return 1MT balance for signer 0", async () => {
    //왜 signer0이 발행자가 되는거지?
    expect(await myTokenContract.balanceOf(signers[0].address)).equal(
      1n * 10n ** 18n
    );
  });
  it("should have 0.5MT", async () => {
    const signer1 = signers[1];
    await myTokenContract.transfer(
      //transfer 함수는 트렌젝션이 일어난다. (state를 건들기 때문에) myTokenContract에 signerfield가 존재하므로 알아서 서명되고,
      //트렌젝션전송되고, 영수증처리된다.-->수수료가 낸다(state수정이 젤 비싸다(모든 노드가 다 해야하니까))
      hre.ethers.parseUnits("0.5", 18),
      signer1.address
    );
    //sol 파일은 contract인거고, test파일은 웹 어플리케이션같은 존재다. ts파일에서 네트워크랑 contract로 통신한다고 생각하면될듯
    console.log(await myTokenContract.balanceOf(signer1.address));
    //근데 여기서 balanceOf같은 view(getter)함수는 트렌젝션을 만들지는 않고 그냥 네트워크 노드에 연결해서 api호출로 가져온다.
    //여러개의 노드에 접속해서 전부 같은지 확인해봐야지 무결성을 검증할 수 있는 신뢰도 높은 프로그램이 된다.
    console.log(await myTokenContract.balanceOf(signers[0].address));
    expect(await myTokenContract.balanceOf(signer1.address)).equal(
      hre.ethers.parseUnits("0.5", 18)
    );
  });
  it("should have 0.5MT", async () => {
    const signer1 = signers[1];
    await myTokenContract.transfer(
      hre.ethers.parseUnits("1.1", 18),
      signer1.address
    );
  });
});
