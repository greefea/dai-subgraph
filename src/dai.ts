import { BigInt } from "@graphprotocol/graph-ts";
import { DAI, Approval, LogNote, Transfer } from "../generated/DAI/DAI";
import { token, transrecord } from "../generated/schema";

export function handleTransfer(event: Transfer): void {

  let id = event.block.timestamp.toHexString()
  let dai = token.load(event.address.toHexString());

  let records = transrecord.load(id);

  if (dai == null) {
    dai = new token(event.address.toHexString());
  }

  if (records == null ){
    records = new transrecord(id);
  }
  let daiContract = DAI.bind(event.address);
  dai.decimals = daiContract.decimals();
  dai.symbol = daiContract.symbol();
  dai.supply = daiContract.totalSupply();
  dai.save();

  records.to = event.params.dst.toHexString();
  records.from = event.params.src.toHexString();
  records.amount = event.params.wad;
  records.save();
}
