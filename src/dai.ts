import { BigInt } from "@graphprotocol/graph-ts";
import { DAI, Approval, LogNote, Transfer } from "../generated/DAI/DAI";
import { token } from "../generated/schema";

export function handleTransfer(event: Transfer): void {
  let dai = token.load(event.address.toHexString());
  if (dai == null) {
    dai = new token(event.address.toHexString());
  }
  let daiContract = DAI.bind(event.address);
  dai.decimals = daiContract.decimals();
  dai.symbol = daiContract.symbol();
  dai.supply = daiContract.totalSupply();

  dai.save();
}
