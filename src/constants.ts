import { Address,BigDecimal, BigInt} from "@graphprotocol/graph-ts";


export const SECONDS_PER_DAY = 60*60*24;
export const SECONDS_PER_HOUR = 60*60;
export const ORACLE_ADDRESS = Address.fromString("0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9");
export const DEFAULT_DECIMAL = 18;
export const FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"

export const INT_ZERO = 0;

export const BIGDECIMAL_8 = BigDecimal.fromString('100000000')
export const BIGDECIMAL_18 = BigDecimal.fromString("1000000000000000000")

export const BIGDECIMAL_ZERO = BigDecimal.fromString("0");
export const BIGDECIMAL_ONE = BigDecimal.fromString("1");
export const BIGINT_ZERO = BigInt.fromString("0");
export const BIGINT_ONE = BigInt.fromString("1");
export const BIGDECIMAL_50 = BigDecimal.fromString("50")
export const BIGDECIMAL_TWO = BigDecimal.fromString("2");

export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_THOUSAND = BigInt.fromI32(1000);
export const BIGINT_THREE_THOUSAND = BigInt.fromI32(3000);
export const BIGINT_FIVE_THOUSAND = BigInt.fromI32(5000);
export const BIGINT_TEN_THOUSAND = BigInt.fromI32(10000);
export const BIGINT_TWENTY_FIVE_THOUSAND = BigInt.fromI32(25000);
export const BIGINT_ONE_HUNDRED_THOUSAND = BigInt.fromI32(100000);
export const BIGINT_TWO_HUNDRED_FIFTY_THOUSAND = BigInt.fromI32(250000);
export const BIGINT_FOUR_HUNDRED_THOUSAND = BigInt.fromI32(400000);

// schema enum
export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const AVALANCHE = "AVALANCHE";
  export const AURORA = "AURORA";
  export const BSC = "BSC"; // aka BNB Chain
  export const CELO = "CELO";
  export const MAINNET = "MAINNET"; // Ethereum mainnet
  export const FANTOM = "FANTOM";
  export const FUSE = "FUSE";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const NEAR_MAINNET = "NEAR_MAINNET";
  export const OPTIMISM = "OPTIMISM";
  export const MATIC = "MATIC"; // aka Polygon
  export const XDAI = "XDAI"; // aka Gnosis Chain
}

export namespace ProtocolType {
  export const EXCHANGE = 'EXCHANGE'
}

export namespace RewardToken {
  export const DEPOSIT = 'DEPOSIT'
}

export namespace LquidityPoolFee {
  export const FIXED_TRADING_FEE = 'FIXED_TRADING_FEE'
}


export const MINIMUM_LIQUIDITY_THREE_THOUSAND = new BigDecimal(
  BIGINT_THREE_THOUSAND
);
export const MINIMUM_LIQUIDITY_FIVE_THOUSAND = new BigDecimal(
  BIGINT_FIVE_THOUSAND
);
export const MINIMUM_LIQUIDITY_TEN_THOUSAND = new BigDecimal(
  BIGINT_TEN_THOUSAND
);
export const MINIMUM_LIQUIDITY_TWENTY_FIVE_THOUSAND = new BigDecimal(
  BIGINT_TWENTY_FIVE_THOUSAND
);
export const MINIMUM_LIQUIDITY_ONE_THOUSAND = new BigDecimal(BIGINT_THOUSAND);
export const MINIMUM_LIQUIDITY_ONE_HUNDRED_THOUSAND = new BigDecimal(
  BIGINT_ONE_HUNDRED_THOUSAND
);
export const MINIMUM_LIQUIDITY_TWO_HUNDRED_FIFTY_THOUSAND = new BigDecimal(
  BIGINT_TWO_HUNDRED_FIFTY_THOUSAND
);
export const MINIMUM_LIQUIDITY_FOUR_HUNDRED_THOUSAND = new BigDecimal(
  BIGINT_FOUR_HUNDRED_THOUSAND
);

