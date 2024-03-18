import { CosmosEvent, CosmosMessage,} from "@subql/types-cosmos";
import { MsgBurn, MsgDisableMint, MsgIssue, MsgMint, MsgSetAuthority, MsgSetMinter, MsgSetUri } from "../types/proto-interfaces/bitsong/fantoken/v1beta1/tx";
import { Attribute } from "../types/proto-interfaces/cosmos/base/abci/v1beta1/abci";
import { Fantoken } from "../types";

export interface EventIssue extends CosmosEvent {
  msg: CosmosMessage<MsgIssue>;
}

export interface EventMint extends CosmosEvent {
  msg: CosmosMessage<MsgMint>;
}

export interface EventBurn extends CosmosEvent {
  msg: CosmosMessage<MsgBurn>;
}

export interface EventSetMinter extends CosmosEvent {
  msg: CosmosMessage<MsgSetMinter>;
}

export interface EventSetAuthority extends CosmosEvent {
  msg: CosmosMessage<MsgSetAuthority>;
}

export interface EventSetUri extends CosmosEvent {
  msg: CosmosMessage<MsgSetUri>;
}

export interface EventDisableMint extends CosmosEvent {
  msg: CosmosMessage<MsgDisableMint>;
}

const parseAttributes = async (attributes: readonly Attribute[]) => {
  const result: any = {};
  for (const attr of attributes) {
    result[attr.key] = attr.value;
  }
  return result;
}

export async function handleEventIssue(event: EventIssue): Promise<void> {
  try {
    const attributes = await parseAttributes(event.event.attributes);
    const denom = attributes.denom.slice(1, -1);

    const {
      name,
      symbol,
      uri,
      authority,
      maxSupply,
      minter
    } = event.msg.msg.decodedMsg;

    const fantoken = Fantoken.create({
      id: denom,
      name,
      symbol,
      uri,
      authority,
      minter,
      supply: BigInt(0),
      maxSupply: BigInt(maxSupply),
      blockHeight: BigInt(event.block.block.header.height),
      txHash: event.tx.hash,
      createdAt: event.block.block.header.time,
    })

    await fantoken.save();

    logger.info(`Fantoken ${denom} issued`)
  } catch (e) {
    logger.error(`Error while processing eventIssue: ${e}`)
  }
}

export async function handleEventMint(event: EventMint): Promise<void> {
  try {
    const { coin } = event.msg.msg.decodedMsg

    const fantoken = await Fantoken.get(coin.denom)
    if (fantoken) {
      fantoken.supply = BigInt(fantoken.supply) + BigInt(coin.amount)
      await fantoken.save()

      logger.info(`Fantoken ${coin.amount} ${coin.denom} minted`)
    } else {
      logger.error(`Error while processing eventMint: Fantoken ${coin.denom} not found`)
    }
  } catch (e) {
    logger.error(`Error while processing eventMint: ${e}`)
  }
}

export async function handleEventBurn(event: EventBurn): Promise<void> {
  try {
    const { coin } = event.msg.msg.decodedMsg

    const fantoken = await Fantoken.get(coin.denom)
    if (fantoken) {
      fantoken.supply = BigInt(fantoken.supply) - BigInt(coin.amount)
      await fantoken.save()

      logger.info(`Fantoken ${coin.amount} ${coin.denom} burned`)
    } else {
      logger.error(`Error while processing eventBurn: Fantoken ${coin.denom} not found`)
    }
  } catch (e) {
    logger.error(`Error while processing eventBurn: ${e}`)
  }
}

export async function handleEventSetMinter(event: EventSetMinter): Promise<void> {
  try {
    const attributes = await parseAttributes(event.event.attributes);
    const denom = attributes.denom.slice(1, -1);

    const { newMinter } = event.msg.msg.decodedMsg

    const fantoken = await Fantoken.get(denom)
    if (fantoken) {
      fantoken.minter = newMinter
      await fantoken.save()

      logger.info(`Fantoken ${denom} minter set to ${newMinter}`)
    } else {
      logger.error(`Error while processing eventSetMinter: Fantoken ${denom} not found`)
    }
  } catch (e) {
    logger.error(`Error while processing eventSetMinter: ${e}`)
  }
}

export async function handleEventSetAuthority(event: EventSetAuthority): Promise<void> {
  try {
    const attributes = await parseAttributes(event.event.attributes);
    const denom = attributes.denom.slice(1, -1);

    const { newAuthority } = event.msg.msg.decodedMsg

    const fantoken = await Fantoken.get(denom)
    if (fantoken) {
      fantoken.authority = newAuthority
      await fantoken.save()

      logger.info(`Fantoken ${denom} authority set to ${newAuthority}`)
    } else {
      logger.error(`Error while processing eventSetAuthority: Fantoken ${denom} not found`)
    }
  } catch (e) {
    logger.error(`Error while processing eventSetAuthority: ${e}`)
  }
}

export async function handleEventSetUri(event: EventSetUri): Promise<void> {
  try {
    const denom = event.msg.msg.decodedMsg.denom;

    const fantoken = await Fantoken.get(denom)
    if (fantoken) {
      const { uri } = event.msg.msg.decodedMsg

      fantoken.uri = uri
      await fantoken.save()
      
      logger.info(`Fantoken ${denom} metadata set`)
    } else {
      logger.error(`Error while processing eventSetUri: Fantoken ${denom} not found`)
    }
  } catch (e) {
    logger.error(`Error while processing eventSetUri: ${e}`)
  }
}

export async function handleEventDisableMint(event: EventDisableMint): Promise<void> {
  try {
    const attributes = await parseAttributes(event.event.attributes);
    const denom = attributes.denom.slice(1, -1);

    const fantoken = await Fantoken.get(denom)
    if (fantoken) {
      fantoken.minter = ""
      await fantoken.save()

      logger.info(`Fantoken ${denom} mint disabled`)
    } else {
      logger.error(`Error while processing eventDisableMint: Fantoken ${denom} not found`)
    }
  } catch (e) {
    logger.error(`Error while processing eventDisableMint: ${e}`)
  }
}
