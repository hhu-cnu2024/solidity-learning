//test파일은 이름을 다 맞추더라
import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";

describe("mytoken deploy", () => {
  let myTokenContract: MyToken;
  before("should deploy", async () => {
    myTokenContract = await hre.ethers.deployContract("MyToken", [
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
    expect(await myTokenContract.totalSupply()).equal(0);
  });
  it("should return 0 balance for signer 0", async () => {
    const signers = await hre.ethers.getSigners();
    expect(await myTokenContract.balanceOf(signers[0].address)).equal(0);
  });
});
