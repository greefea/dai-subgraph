import { Address,BigDecimal, BigInt} from "@graphprotocol/graph-ts";

export const SECONDS_PER_DAY = 60*60*24;
export const ORACLE_ADDRESS = Address.fromString("0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9");

export const BIGDECIMAL_8 = BigDecimal.fromString('100000000')
export const BIGDECIMAL_18 = BigDecimal.fromString("1000000000000000000")

export const BIGDECIMAL_ZERO = BigDecimal.fromString("0");
export const BIGDECIMAL_ONE = BigDecimal.fromString("1");
export const BIGINT_ZERO = BigInt.fromString("0");
export const BIGINT_ONE = BigInt.fromString("1");




