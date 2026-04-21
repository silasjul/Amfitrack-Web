import enum
import array
import struct

import amfiprot.payload
from amfiprot.payload import Payload


class PayloadType(enum.IntEnum):

    SOURCE_COIL_DATA = 0x10  # DEPRECATED
    REQUEST_CALIBRATION_SIGNAL = 0x11  

    CALIBRATE = 0x12
    CALIBRATE_IF_UNCALIBRATED = 0x13

    EMF = 0x14  # DEPRECATED
    EMF_TIMESTAMP = 0x15  # DEPRECATED
    EMF_IMU = 0x16  # DEPRECATED
    EMF_IMU_TIMESTAMP = 0x17  # DEPRECATED
    IMU = 0x18  # DEPRECATED
    IMU_TIMESTAMP = 0x19  # DEPRECATED
    EMF_IMU_FRAME_ID = 0x1A

    SET_SEND_IMU = 0x20  # DEPRECATED
    SOURCE_COIL_CAL_DATA = 0x21  # DEPRECATED
    SOURCE_COIL_CAL_IMU_DATA = 0x22  # DEPRECATED
    SOURCE_CALIBRATION = 0x23
    SOURCE_MEASUREMENT = 0x24

    METADATA = 0x80  # DEPRECATED
    EMF_META = 0x81  # DEPRECATED
    EMF_IMU_META = 0x82  # DEPRECATED

    RAW_B_FIELD_X = 0xA0  # DEPRECATED
    RAW_B_FIELD_Y = 0xA1  # DEPRECATED
    RAW_B_FIELD_Z = 0xA2  # DEPRECATED
    RAW_B_FIELD_REF = 0xA3  # DEPRECATED
    RAW_B_FIELD = 0xA4
    NORM_B_FIELD = 0xA5
    B_FIELD_PHASE = 0xA6
    NORM_B_FIELD_IMU = 0xA7

    CALIBRATED_B_FIELD_X = 0xB3  # DEPRECATED
    CALIBRATED_B_FIELD_Y = 0xB4  # DEPRECATED
    CALIBRATED_B_FIELD_Z = 0xB5  # DEPRECATED
    SOURCE_CROSS_TALK = 0xC0
    RAW_ADC_SAMPLES = 0xE0

    RAW_FLOATS = 0xE1
    STOP_CALIBRATION_SIGNAL = 0xE2
    SET_PHASE_MODULATION = 0xE3
    SIGN_DATA = 0xE4
    PLL = 0xE5

"""
TODO: Instead of making separate classes for each EMF/IMU type payload (with lots of code duplication), maybe create EMF payload and use decorator
pattern to create the rest? Or create e.g. and EMF (data)class that has pos and quat data, so you access it via
packet.payload.emf.pos_x and packet.payload.imu.acc_x.
"""


class CalibratePayload(Payload):
    payload_type = PayloadType.CALIBRATE

    def __init__(self, source_tx_id=0xFF):
        self.data = array.array('B', [source_tx_id])
        self.source_tx_id = source_tx_id

    def __len__(self) -> int:
        return len(self.data)

    def __str__(self) -> str:
        return "<Calibrate> " + str(self.to_dict())

    @property
    def type(self) -> PayloadType:
        return self.payload_type

    def to_bytes(self) -> array.array:
        return array.array('B', self.data)

    def to_dict(self) -> dict:
        return {
            'source_tx_id': self.source_tx_id
        }


class SetPhaseModulationPayload(Payload):
    payload_type = PayloadType.SET_PHASE_MODULATION

    def __init__(self, data):
        self.enable = data[0]
        self.data = array.array('B', [self.enable])

    def __len__(self):
        return len(self.data)

    def __str__(self):
        return "<Set Phase Modulation>" + str(self.to_dict())

    @property
    def type(self) -> PayloadType:
        return self.payload_type

    def to_bytes(self) -> array.array:
        return array.array('B', self.data)

    def to_dict(self) -> dict:
        return {
            'enable': self.enable
        }


class EmfPayload(Payload):
    payload_type = PayloadType.EMF

    def __init__(self, data):
        self.data = data
        self.emf = EmfData(data[0:21])
        self.sensor_status = data[21]
        self.source_coil_id = data[22]

    def __len__(self) -> int:
        """ Length of the payload in bytes (without the CRC byte) """
        return len(self.data)

    def __str__(self) -> str:
        return "<EMF> " + str(self.to_dict())

    @property
    def type(self) -> PayloadType:
        return self.payload_type

    def to_bytes(self) -> array.array:
        return array.array('B', self.data)

    def to_dict(self) -> dict:
        return {
            'emf': self.emf.to_dict(),
            'sensor_status': self.sensor_status,
            'source_coil_id': self.source_coil_id,
        }


class EmfTimestampPayload(Payload):
    payload_type = PayloadType.EMF_TIMESTAMP

    def __init__(self, data):
        self.data = data
        self.emf = EmfData(data[0:21])
        self.sensor_status = data[21]
        self.source_coil_id = data[22]
        self.timestamp = int.from_bytes(data[23:27], byteorder='little', signed=False)

    def __len__(self) -> int:
        """ Length of the payload in bytes (without the CRC byte) """
        return len(self.data)

    def __str__(self) -> str:
        return "<EMF Timestamp> " + str(self.to_dict())

    @property
    def type(self) -> PayloadType:
        return self.payload_type

    def to_bytes(self) -> array.array:
        return array.array('B', self.data)

    def to_dict(self) -> dict:
        return {
            'emf': self.emf.to_dict(),
            'timestamp': self.timestamp,
            'sensor_status': self.sensor_status,
            'source_coil_id': self.source_coil_id,
        }


class EmfImuPayload(Payload):
    payload_type = 0x16

    def __init__(self, data):
        self.data = data
        self.emf = EmfData(data[0:21])
        self.sensor_status = data[21]
        self.source_coil_id = data[22]
        self.imu = ImuDataOld(data[23:47])

    def __len__(self) -> int:
        """ Length of the payload in bytes (without the CRC byte) """
        return len(self.data)

    def __str__(self) -> str:
        return "<EMF IMU> " + str(self.to_dict())

    @property
    def type(self) -> PayloadType:
        return self.payload_type

    def to_bytes(self) -> array.array:
        return array.array('B', self.data)

    def to_dict(self) -> dict:
        return {
            'emf': self.emf.to_dict(),
            'imu': self.imu.to_dict(),
            'sensor_status': self.sensor_status,
            'source_coil_id': self.source_coil_id,
        }


class EmfImuTimestampPayload(Payload):
    payload_type = 0x16

    def __init__(self, data):
        self.data = data
        self.emf = EmfData(data[0:21])
        self.sensor_status = data[21]
        self.source_coil_id = data[22]
        self.imu = ImuDataOld(data[23:47])
        self.timestamp = int.from_bytes(data[47:49], byteorder='little', signed=False)

    def __len__(self) -> int:
        """ Length of the payload in bytes (without the CRC byte) """
        return len(self.data)

    def __str__(self) -> str:
        return "<EMF IMU> " + str(self.to_dict())

    @property
    def type(self) -> PayloadType:
        return self.payload_type

    def to_bytes(self) -> array.array:
        return array.array('B', self.data)

    def to_dict(self) -> dict:
        return {
            'emf': self.emf.to_dict(),
            'imu': self.imu.to_dict(),
            'sensor_status': self.sensor_status,
            'source_coil_id': self.source_coil_id,
        }


class EmfImuFrameIdPayload(amfiprot.payload.Payload):
    payload_type = PayloadType.EMF_IMU_FRAME_ID

    def __init__(self, data):
        self.data = data
        self.emf = EmfData(self.data[0:21])
        self.sensor_status = self.data[21]
        self.source_coil_id = self.data[22]
        self.calc_id = int.from_bytes(self.data[23:25], byteorder='little', signed=False)
        self.imu = ImuData(self.data[25:37])
        self.magneto = MagnetoData(self.data[37:43])
        self.temperature = self.data[43] * 0.5 - 30
        self.sensor_state = self.data[44]
        self.metal_distortion = self.data[45]
        self.gpio_state = int.from_bytes(self.data[46:48], byteorder='little', signed=False)
        self.rssi = self.data[48]
        self.frame_id = int.from_bytes(self.data[49:52], byteorder='little', signed=False)

    def __len__(self) -> int:
        """ Length of the payload in bytes (without the CRC byte) """
        return len(self.data)

    def __str__(self) -> str:
        return "<EMF FrameID> " + str(self.to_dict())

    @property
    def type(self) -> PayloadType:
        return self.payload_type

    def to_bytes(self) -> array.array:
        return array.array('B', self.data)

    def to_dict(self) -> dict:
        return {
            'frame_id': self.frame_id,
            'emf': self.emf.to_dict(),
            'imu': self.imu.to_dict(),
            'magneto': self.magneto.to_dict(),
            'temperature': self.temperature,
            'sensor_status': self.sensor_status,
            'sensor_state': self.sensor_state,
            'metal_distortion': self.metal_distortion,
            'rssi': self.rssi,
            'source_coil_id': self.source_coil_id,
            'calc_id': self.calc_id,
            'gpio_state': self.gpio_state
        }


class RawBFieldPayload(amfiprot.payload.Payload):
    """
    B-field given as a two-dimensional array (source_on_sensor):
    ((x_on_x, x_on_y, x_on_z),
     (y_on_x, y_on_y, y_on_z),
     (z_on_x, z_on_y, z_on_z))
    """
    payload_type = PayloadType.RAW_B_FIELD

    def __init__(self, data):
        self.data = data
        b_field_data = struct.unpack("<9f", data[0:36])
        self.b_field = ((b_field_data[0], b_field_data[1], b_field_data[2]),
                        (b_field_data[3], b_field_data[4], b_field_data[5]),
                        (b_field_data[6], b_field_data[7], b_field_data[8]))
        self.current = struct.unpack("<3f", data[36:48])
        self.sensor_status = data[48]
        self.source_coil_id = data[49]
        self.frame_id = int.from_bytes(data[50:53], byteorder='little', signed=False)

    def __len__(self) -> int:
        return len(self.data)

    def __str__(self) -> str:
        return "<Raw B-Field> " + str(self.to_dict())

    @property
    def type(self) -> PayloadType:
        return self.payload_type

    def to_bytes(self) -> array.array:
        return array.array('B', self.data)

    def to_dict(self) -> dict:
        return {
            'b_field': self.b_field,
            'current': self.current,
            'sensor_status': self.sensor_status,
            'source_coil_id': self.source_coil_id,
            'frame_id': self.frame_id
        }

class NormBFieldPayload(RawBFieldPayload):
    payload_type = PayloadType.NORM_B_FIELD

class NormBFieldImuPayload(amfiprot.payload.Payload):
    """
    B-field given as a two-dimensional array (source_on_sensor):
    ((x_on_x, x_on_y, x_on_z),
     (y_on_x, y_on_y, y_on_z),
     (z_on_x, z_on_y, z_on_z))
    """
    payload_type = PayloadType.NORM_B_FIELD_IMU

    def __init__(self, data):
        self.data = data
        b_field_data = struct.unpack("<9f", self.data[0:36])
        self.b_field = ((b_field_data[0], b_field_data[1], b_field_data[2]),
                        (b_field_data[3], b_field_data[4], b_field_data[5]),
                        (b_field_data[6], b_field_data[7], b_field_data[8]))
        self.sensor_status = self.data[36]
        self.source_coil_id = self.data[37]
        self.acc = AccelerometerData(self.data[38:44]) #ImuData(self.data[38:50])
        self.magneto = MagnetoData(self.data[44:50])
        self.metal_distortion = self.data[50]
        self.frame_id = int.from_bytes(self.data[51:54], byteorder='little', signed=False)

    def __len__(self) -> int:
        return len(self.data)

    def __str__(self) -> str:
        return "<Norm B-Field IMU> " + str(self.to_dict())

    @property
    def type(self) -> PayloadType:
        return self.payload_type

    def to_bytes(self) -> array.array:
        return array.array('B', self.data)

    def to_dict(self) -> dict:
        return {
            'b_field': self.b_field,
            'sensor_status': self.sensor_status,
            'source_coil_id': self.source_coil_id,
            'acc': self.acc.to_dict(),
            'magneto': self.magneto.to_dict(),
            'metal_distortion': self.metal_distortion,
            'frame_id': self.frame_id
        }
    

class SourceCoilCalDataPayload(amfiprot.payload.Payload):
    payload_type = PayloadType.SOURCE_COIL_CAL_DATA

    def __init__(self, data):
        self.data = data
        self.current = struct.unpack("<3f", data[0:12])
        self.frequency = struct.unpack("<3f", data[12:24])
        self.calibration = struct.unpack("<3f", data[24:36])

    def __len__(self) -> int:
        return len(self.data)

    def __str__(self) -> str:
        return "<Source Coil Calibration> " + str(self.to_dict())

    @property
    def type(self) -> PayloadType:
        return self.payload_type

    def to_bytes(self) -> array.array:
        return array.array('B', self.data)

    def to_dict(self) -> dict:
        return {
            'current': self.current,
            'frequency': self.frequency,
            'calibration': self.calibration
        }

class SourceCalibrationPayload(amfiprot.payload.Payload):
    payload_type = PayloadType.SOURCE_CALIBRATION

    def __init__(self, data):
        self.data = data
        self.frequency = struct.unpack("<3f", data[0:12])
        self.calibration = struct.unpack("<3f", data[12:24])
        self.phase_modulation_offset = struct.unpack("<3f", data[24:36])

    def __len__(self) -> int:
        return len(self.data)

    def __str__(self) -> str:
        return "<Source Calibration> " + str(self.to_dict())

    @property
    def type(self) -> PayloadType:
        return self.payload_type

    def to_bytes(self) -> array.array:
        return array.array('B', self.data)

    def to_dict(self) -> dict:
        return {
            'frequency': self.frequency,
            'calibration': self.calibration,
            'phase_modulation_offset': self.phase_modulation_offset
        }

class SourceMeasurementPayload(amfiprot.payload.Payload):
    payload_type = PayloadType.SOURCE_MEASUREMENT

    def __init__(self, data):
        self.data = data
        self.current = struct.unpack("<3f", data[0:12])
        self.imu = ImuData(self.data[12:24])
        self.magneto = MagnetoData(self.data[24:30])
        self.temperature = self.data[30] * 0.5 - 30
        self.source_status = self.data[31]
        self.source_state = self.data[32]
        self.rssi = self.data[33]
        self.frame_id = int.from_bytes(data[34:37], byteorder='little', signed=False)
        if len(data)>37:
            self.voltage = struct.unpack("<4f", data[37:55])
        else:
            self.voltage = (0,0,0,0)

    def __len__(self) -> int:
        return len(self.data)

    def __str__(self) -> str:
        return "<Source Measurement> " + str(self.to_dict())

    @property
    def type(self) -> PayloadType:
        return self.payload_type

    def to_bytes(self) -> array.array:
        return array.array('B', self.data)

    def to_dict(self) -> dict:
        return {
            'frame_id': self.frame_id,
            'current': self.current,
            'imu': self.imu.to_dict(),
            'magneto': self.magneto.to_dict(),
            'temperature': self.temperature,
            'source_status': self.source_status,
            'source_state': self.source_state,
            'rssi': self.rssi,
            'voltage': self.voltage
        }

class SignDataPayload(amfiprot.Payload):
    payload_type = PayloadType.SIGN_DATA

    def __init__(self, data):
        self.data = data
        self.coil_index = data[0]
        self.reference_channel = data[1]
        unpacked_floats = struct.unpack("<4f", data[2:18])
        self.pll_freq = unpacked_floats[0]
        self.phase_division = unpacked_floats[1]
        self.remainder = unpacked_floats[2]
        self.offset = unpacked_floats[3]
        self.sign_stable = data[18]

    def __len__(self) -> int:
        return len(self.data)

    def __str__(self) -> str:
        return "<Sign Data> " + str(self.to_dict())

    @property
    def type(self) -> PayloadType:
        return self.payload_type

    def to_bytes(self) -> array.array:
        return array.array('B', self.data)

    def to_dict(self) -> dict:
        return {
            'coil_index': self.coil_index,
            'reference_channel': self.reference_channel,
            'pll_freq': self.pll_freq,
            'phase_division': self.phase_division,
            'remainder': self.remainder,
            'offset': self.offset,
            'sign_stable': self.sign_stable
        }


class PllPayload(amfiprot.Payload):
    payload_type = PayloadType.PLL

    def __init__(self, data):
        self.data = data
        self.coil_index = data[0]
        self.frequency = struct.unpack("<f", data[1:5])[0]
        self.amplitude = struct.unpack("<3f", data[5:17])
        self.phase = struct.unpack("<3f", data[17:29])

    def __len__(self) -> int:
        return len(self.data)

    def __str__(self) -> str:
        return "<PLL Data> " + str(self.to_dict())

    @property
    def type(self) -> PayloadType:
        return self.payload_type

    def to_bytes(self) -> array.array:
        return array.array('B', self.data)

    def to_dict(self) -> dict:
        return {
            'coil_index': self.coil_index,
            'frequency': self.frequency,
            'amplitude': self.amplitude,
            'phase': self.phase
        }


class RawFloatPayload(amfiprot.Payload):
    payload_type = PayloadType.RAW_FLOATS

    def __init__(self, data):
        self.data = data
        self.floats = []
        for x in range(12):
            self.floats.append(struct.unpack("<f", data[4*x:4*(x+1)])[0])

    def __len__(self) -> int:
        return len(self.data)

    def __str__(self) -> str:
        return "<Raw Floats> " + str(self.to_dict())

    @property
    def type(self) -> PayloadType:
        return self.payload_type

    def to_bytes(self) -> array.array:
        return array.array('B', self.data)

    def to_dict(self) -> dict:
        return {
            'floats': self.floats,
        }
    

amfitrack_payload_mappings = {
    PayloadType.CALIBRATE: CalibratePayload,
    PayloadType.SOURCE_COIL_CAL_DATA: SourceCoilCalDataPayload,
    PayloadType.SOURCE_CALIBRATION: SourceCalibrationPayload,
    PayloadType.SOURCE_MEASUREMENT: SourceMeasurementPayload,
    PayloadType.SET_PHASE_MODULATION: SetPhaseModulationPayload,
    PayloadType.EMF: EmfPayload,
    PayloadType.EMF_TIMESTAMP: EmfTimestampPayload,
    PayloadType.EMF_IMU: EmfImuPayload,
    PayloadType.EMF_IMU_TIMESTAMP: EmfImuTimestampPayload,
    PayloadType.EMF_IMU_FRAME_ID: EmfImuFrameIdPayload,
    PayloadType.RAW_B_FIELD: RawBFieldPayload,
    PayloadType.NORM_B_FIELD: NormBFieldPayload,
    PayloadType.NORM_B_FIELD_IMU: NormBFieldImuPayload,
    PayloadType.SIGN_DATA: SignDataPayload,
    PayloadType.PLL: PllPayload,
    PayloadType.RAW_FLOATS: RawFloatPayload
}


def interpret_amfitrack_payload(payload: amfiprot.Payload, payload_type) -> amfiprot.Payload:
    if payload_type in amfitrack_payload_mappings:
        return amfitrack_payload_mappings[payload_type](payload.to_bytes())  # type: ignore
    else:
        return payload


def interpret_amfitrack_packet(packet: amfiprot.Packet) -> amfiprot.Packet:
    """ Reinterprets the packet in place, i.e. it does not make a copy."""
    packet.payload = interpret_amfitrack_payload(packet.payload, packet.payload_type)
    return packet


class EmfData:
    def __init__(self, data):
        self.pos_x = float(int.from_bytes(data[0:3], byteorder='little', signed=True)) / 100.0
        self.pos_y = float(int.from_bytes(data[3:6], byteorder='little', signed=True)) / 100.0
        self.pos_z = float(int.from_bytes(data[6:9], byteorder='little', signed=True)) / 100.0

        self.quat_x = float(int.from_bytes(data[9:12], byteorder='little', signed=True)) / 1000000.0
        self.quat_y = float(int.from_bytes(data[12:15], byteorder='little', signed=True)) / 1000000.0
        self.quat_z = float(int.from_bytes(data[15:18], byteorder='little', signed=True)) / 1000000.0
        self.quat_w = float(int.from_bytes(data[18:21], byteorder='little', signed=True)) / 1000000.0

    def __str__(self):
        return f"Position: ({self.pos_x:.2f}, {self.pos_y:.2f}, {self.pos_z:.2f}) " \
               f"Orientation: ({self.quat_x:.2f}, {self.quat_y:.2f}, {self.quat_z:.2f}, {self.quat_w:.2f})"
    
    def to_dict(self) -> dict:
        return {
            'pos_x': self.pos_x,
            'pos_y': self.pos_y,
            'pos_z': self.pos_z,
            'quat_x': self.quat_x,
            'quat_y': self.quat_y,
            'quat_z': self.quat_z,
            'quat_w': self.quat_w
        }

class ImuDataOld:
    def __init__(self, data):
        self.acc_x = float(int.from_bytes(data[0:2], byteorder='little', signed=True)) * 0.000122  # In g
        self.acc_y = float(int.from_bytes(data[2:4], byteorder='little', signed=True)) * 0.000122
        self.acc_z = float(int.from_bytes(data[4:6], byteorder='little', signed=True)) * 0.000122

        self.gyro_x = float(int.from_bytes(data[6:8], byteorder='little', signed=True)) * 0.07  # In deg per sec
        self.gyro_y = float(int.from_bytes(data[8:10], byteorder='little', signed=True)) * 0.07
        self.gyro_z = float(int.from_bytes(data[10:12], byteorder='little', signed=True)) * 0.07

        self.quat_x = float(int.from_bytes(data[12:15], byteorder='little', signed=True)) / 1000000.0
        self.quat_y = float(int.from_bytes(data[15:18], byteorder='little', signed=True)) / 1000000.0
        self.quat_z = float(int.from_bytes(data[18:21], byteorder='little', signed=True)) / 1000000.0
        self.quat_w = float(int.from_bytes(data[21:24], byteorder='little', signed=True)) / 1000000.0
        
    def __str__(self):
        return f"Acc: ({self.acc_x:.2f}, {self.acc_y:.2f}, {self.acc_z:.2f}) " \
               f"Gyro: ({self.gyro_x:.2f}, {self.gyro_y:.2f}, {self.gyro_z:.2f}) " \
               f"Quaternions: ({self.quat_x:.2f},{self.quat_y:.2f}, {self.quat_z:.2f}, {self.quat_w:.2f})"
    
    def to_dict(self) -> dict:
        return {
            'acc_x': self.acc_x,
            'acc_y': self.acc_y,
            'acc_z': self.acc_z,
            'gyro_x': self.gyro_x,
            'gyro_y': self.gyro_y,
            'gyro_z': self.gyro_z,
            'quat_x': self.quat_x,
            'quat_y': self.quat_y,
            'quat_z': self.quat_z,
            'quat_w': self.quat_w
        }

class ImuData:
    def __init__(self, data):
        self.acc_x = float(int.from_bytes(data[0:2], byteorder='little', signed=True)) * 0.000122  # In g
        self.acc_y = float(int.from_bytes(data[2:4], byteorder='little', signed=True)) * 0.000122
        self.acc_z = float(int.from_bytes(data[4:6], byteorder='little', signed=True)) * 0.000122

        self.gyro_x = float(int.from_bytes(data[6:8], byteorder='little', signed=True)) * 0.07  # In deg per sec
        self.gyro_y = float(int.from_bytes(data[8:10], byteorder='little', signed=True)) * 0.07
        self.gyro_z = float(int.from_bytes(data[10:12], byteorder='little', signed=True)) * 0.07

    def __str__(self):
        return f"Acc: ({self.acc_x:.2f}, {self.acc_y:.2f}, {self.acc_z:.2f}) " \
               f"Gyro: ({self.gyro_x:.2f}, {self.gyro_y:.2f}, {self.gyro_z:.2f}) " \
    
    def to_dict(self) -> dict:
        return {
            'acc_x': self.acc_x,
            'acc_y': self.acc_y,
            'acc_z': self.acc_z,
            'gyro_x': self.gyro_x,
            'gyro_y': self.gyro_y,
            'gyro_z': self.gyro_z
        }

class MagnetoData:
    def __init__(self, data):
        self.mag_x = float(int.from_bytes(data[0:2], byteorder='little', signed=True)) * 0.012207
        self.mag_y = float(int.from_bytes(data[2:4], byteorder='little', signed=True)) * 0.012207
        self.mag_z = float(int.from_bytes(data[4:6], byteorder='little', signed=True)) * 0.012207

    def __str__(self):
        return f"Magneto: ({self.mag_x:.2f}, {self.mag_y:.2f}, {self.mag_z:.2f}) "
        
    def to_dict(self) -> dict:
        return {
            'mag_x': self.mag_x,
            'mag_y': self.mag_y,
            'mag_z': self.mag_z
        }
    
class AccelerometerData:
    def __init__(self, data):
        self.acc_x = float(int.from_bytes(data[0:2], byteorder='little', signed=True)) * 0.000122  # In g
        self.acc_y = float(int.from_bytes(data[2:4], byteorder='little', signed=True)) * 0.000122
        self.acc_z = float(int.from_bytes(data[4:6], byteorder='little', signed=True)) * 0.000122
    
    def __str__(self):
        return f"Acc: ({self.acc_x:.2f}, {self.acc_y:.2f}, {self.acc_z:.2f}) "
    
    def to_dict(self) -> dict:
        return {
            'acc_x': self.acc_x,
            'acc_y': self.acc_y,
            'acc_z': self.acc_z
        }