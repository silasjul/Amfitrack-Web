import amfiprot
from typing import Optional
from .payload import *


class Device(amfiprot.Device):
    def __init__(self, node: amfiprot.Node):
        super().__init__(node)

    def get_packet(self) -> Optional[amfiprot.Packet]:
        packet = self.node.get_packet()

        if packet is not None and type(packet.payload) == amfiprot.payload.UndefinedPayload:
            # Reinterpret the payload
            packet.payload = interpret_amfitrack_payload(packet.payload, packet.payload_type)

        return packet

    def calibrate(self, source_tx_id=0xFF):
        self.node.send_payload(CalibratePayload())

    def set_phase_modulation(self, enabled: bool):
        self.node.send_payload(SetPhaseModulationPayload([enabled]))
