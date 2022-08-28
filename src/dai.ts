import { BigInt, ByteArray, log} from "@graphprotocol/graph-ts";
import { DAI, Approval, LogNote, Transfer } from "../generated/DAI/DAI";
import { token, transfer, dailyTransfer } from "../generated/schema";

export function handleTransfer(event: Transfer): void {

  let dai = token.load(event.address.toHexString());

  let records = transfer.load(event.transaction.hash.toHexString());
  let day = (event.block.timestamp.toI32() - (event.block.timestamp.toI32()%(60*60*24))).toString();

  let daily = dailyTransfer.load(day);

  // let dailydata = dailyTranfer.load(event.)
  log.info('block timestamp: {}',[event.block.timestamp.toString()])

  if (dai == null) {
    dai = new token(event.address.toHexString());
  }

  if (records == null ){
    records = new transfer(event.transaction.hash.toHexString());
  }

  if (daily == null){
    daily = new dailyTransfer(day);
    daily.amount = new BigInt(0);
    daily.transfers = 0;
    daily.save();
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

  let transferArray = new Array<String>();
  if (transferArray.indexOf(event.params.src.toHexString(),0)==-1){
    transferArray.push(event.params.src.toHexString());
    daily.transfers = daily.transfers + 1;
  }
  if (transferArray.indexOf(event.params.dst.toHexString(),0)==-1){
    transferArray.push(event.params.dst.toHexString());
    daily.transfers = daily.transfers + 1;
  }

  daily.amount = daily.amount.plus(event.params.wad);
  daily.save();
}
