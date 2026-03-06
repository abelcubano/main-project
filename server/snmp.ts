import snmp from "net-snmp";

export type PduPortStatus = {
  portNumber: number;
  state: "on" | "off" | "reboot" | "unknown";
  rawValue: number;
};

export async function getPduPortStatus(
  host: string,
  port: number,
  community: string,
  version: string,
  oid: string,
  portNumber: number
): Promise<PduPortStatus> {
  return new Promise((resolve, reject) => {
    const snmpVersion = version === "v1" ? snmp.Version1 : snmp.Version2c;
    const session = snmp.createSession(host, community, {
      port,
      version: snmpVersion,
      timeout: 5000,
      retries: 1,
    });

    const fullOid = `${oid}.${portNumber}`;

    session.get([fullOid], (error: any, varbinds: any[]) => {
      session.close();
      if (error) {
        reject(new Error(`SNMP GET failed: ${error.message}`));
        return;
      }
      if (varbinds.length === 0) {
        reject(new Error("No SNMP response"));
        return;
      }
      if (snmp.isVarbindError(varbinds[0])) {
        reject(new Error(`SNMP error: ${snmp.varbindError(varbinds[0])}`));
        return;
      }

      const rawValue = varbinds[0].value;
      let state: PduPortStatus["state"] = "unknown";
      if (rawValue === 1) state = "on";
      else if (rawValue === 2) state = "off";
      else if (rawValue === 3) state = "reboot";

      resolve({ portNumber, state, rawValue: Number(rawValue) });
    });
  });
}

export async function rebootPduPort(
  host: string,
  port: number,
  community: string,
  version: string,
  controlOid: string,
  portNumber: number
): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve, reject) => {
    const snmpVersion = version === "v1" ? snmp.Version1 : snmp.Version2c;
    const session = snmp.createSession(host, community, {
      port,
      version: snmpVersion,
      timeout: 5000,
      retries: 1,
    });

    const fullOid = `${controlOid}.${portNumber}`;
    const rebootValue = 3;

    const varbinds = [
      {
        oid: fullOid,
        type: snmp.ObjectType.Integer,
        value: rebootValue,
      },
    ];

    session.set(varbinds, (error: any) => {
      session.close();
      if (error) {
        reject(new Error(`SNMP SET failed: ${error.message}`));
        return;
      }
      resolve({ success: true, message: `Port ${portNumber} reboot command sent` });
    });
  });
}
