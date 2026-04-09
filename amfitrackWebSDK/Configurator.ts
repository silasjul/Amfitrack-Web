import HIDManager from "./HIDManager";
import { PacketBuilder, AmfiprotPayloadType } from "./packets/PacketBuilder";
import { CommonPayloadId } from "./packets/decoders/CommonPayload";

/**
 * High-level configuration interface for amfiprot devices.
 *
 * Mirrors Configurator in configurator.py.
 * Each method sends a command packet and awaits the matching reply.
 */
export class Configurator {
  private hidManager: HIDManager;
  private packetBuilder = new PacketBuilder();

  constructor(hidManager: HIDManager) {
    this.hidManager = hidManager;
  }

  /**
   * Sends a Common payload and waits for a specific reply.
   *
   * This is the core request/reply pattern used by all configurator methods,
   * equivalent to:
   *   self.device.node.send_payload(RequestPayload())
   *   packet = self.device._await_packet(ReplyPayload)
   */
  private sendCommonPayload(
    device: HIDDevice,
    payloadBytes: Uint8Array,
    expectedReplyId: CommonPayloadId,
    timeoutMs = 2000,
  ): Promise<Uint8Array> {
    const packet = this.packetBuilder.build(payloadBytes);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        device.removeEventListener("inputreport", onInput);
        reject(
          new Error(
            `Timeout waiting for reply 0x${expectedReplyId.toString(16)}`,
          ),
        );
      }, timeoutMs);

      const onInput = (event: HIDInputReportEvent) => {
        const bytes = new Uint8Array(event.data.buffer);
        // Incoming layout: [length_prefix, header(6), hdr_crc, payload..., payload_crc, padding]
        const payloadType = bytes[4];
        if (payloadType !== AmfiprotPayloadType.COMMON) return;
        const replyId = bytes[8];
        if (replyId !== expectedReplyId) return;

        clearTimeout(timeout);
        device.removeEventListener("inputreport", onInput);

        const payloadLength = bytes[1];
        resolve(bytes.subarray(8, 8 + payloadLength));
      };

      device.addEventListener("inputreport", onInput);

      this.hidManager.sendReport(device, packet).catch((err: Error) => {
        clearTimeout(timeout);
        device.removeEventListener("inputreport", onInput);
        reject(new Error(`Failed to send report: ${err.message}`));
      });
    });
  }

  /**
   * Mirrors Configurator._get_category_count() in configurator.py.
   *
   * Sends REQUEST_CATEGORY_COUNT (0x1A), awaits REPLY_CATEGORY_COUNT (0x1B).
   * Reply payload: [0x1B, category_count]
   */
  private async getCategoryCount(device: HIDDevice): Promise<number> {
    await this.hidManager.openDevice(device);
    const reply = await this.sendCommonPayload(
      device,
      new Uint8Array([CommonPayloadId.REQUEST_CATEGORY_COUNT]),
      CommonPayloadId.REPLY_CATEGORY_COUNT,
    );
    return reply[1];
  }

  private async getCategoryName(device: HIDDevice, index: number): Promise<string> {
    return "";
  }

  private async getParameterCount(device: HIDDevice, categoryIndex: number): Promise<number> {
    return 0;
  }

  private async getParameterNameAndUid(device: HIDDevice, categoryIndex: number, parameterIndex: number): Promise<{ name: string; uid: number }> {
    return { name: "", uid: 0 };
  }

  public async getConfiguration(device: HIDDevice): Promise<{ name: string; uid: number; value: number }[]> {
    const config = [];

    const categoryCount = await this.getCategoryCount(device);
    console.log("Category count:", categoryCount);
    return [];
  }
}
