import { expect } from "chai";
import { ethers } from "hardhat";
import { MockCtfChallenge } from "../typechain";

let mockCtfChallenge: MockCtfChallenge;

describe("MockCtfChallenge Contract", function () {
  it("Should deploy MockCtfChallenge", async function () {
    const MockCtfChallengeFactory = await ethers.getContractFactory("MockCtfChallenge");
    mockCtfChallenge = await MockCtfChallengeFactory.deploy()
    await mockCtfChallenge.deployed()
  });

  it("Should fail to return the flag", async function () {
    expect(await mockCtfChallenge.getFlag(41)).to.be.equal('try harder')
  });
});
