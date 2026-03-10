import { storage } from "./storage";

interface ZabbixConfig {
  url: string;
  token: string;
}

async function getZabbixConfig(): Promise<ZabbixConfig | null> {
  try {
    const settings = await storage.getBillingSettings();
    if (!settings?.zabbixUrl || !settings?.zabbixApiToken) return null;
    return { url: settings.zabbixUrl, token: settings.zabbixApiToken };
  } catch {
    return null;
  }
}

async function zabbixRequest(method: string, params: any): Promise<any> {
  const config = await getZabbixConfig();
  if (!config) return null;

  const baseUrl = config.url.replace(/\/api_jsonrpc\.php\/?$/, "");
  const response = await fetch(`${baseUrl}/api_jsonrpc.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.token}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id: 1,
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  if (data.error) {
    console.error("[ZABBIX] API error:", data.error);
    return null;
  }
  return data.result;
}

export async function searchZabbixHosts(query: string): Promise<any[]> {
  const result = await zabbixRequest("host.get", {
    output: ["hostid", "host", "name", "status"],
    search: { name: query, host: query },
    searchByAny: true,
    limit: 20,
  });
  return result || [];
}

export async function getZabbixHostInterfaces(hostId: string): Promise<any[]> {
  const result = await zabbixRequest("hostinterface.get", {
    output: ["interfaceid", "ip", "dns", "port", "type", "main"],
    hostids: hostId,
  });
  return result || [];
}

export async function getZabbixPortStatuses(hostId: string): Promise<any[]> {
  const items = await zabbixRequest("item.get", {
    output: ["itemid", "name", "lastvalue", "lastclock", "key_", "units"],
    hostids: hostId,
    search: { key_: "ifOperStatus" },
    sortfield: "name",
  });

  if (!items || items.length === 0) {
    const altItems = await zabbixRequest("item.get", {
      output: ["itemid", "name", "lastvalue", "lastclock", "key_", "units"],
      hostids: hostId,
      search: { key_: "net.if.status" },
      sortfield: "name",
    });
    return (altItems || []).map((item: any) => ({
      itemId: item.itemid,
      name: item.name,
      key: item.key_,
      status: item.lastvalue === "1" ? "up" : "down",
      rawValue: item.lastvalue,
      lastUpdate: item.lastclock ? new Date(parseInt(item.lastclock) * 1000).toISOString() : null,
    }));
  }

  return items.map((item: any) => ({
    itemId: item.itemid,
    name: item.name,
    key: item.key_,
    status: item.lastvalue === "1" ? "up" : "down",
    rawValue: item.lastvalue,
    lastUpdate: item.lastclock ? new Date(parseInt(item.lastclock) * 1000).toISOString() : null,
  }));
}

export async function getZabbixPowerData(hostId: string): Promise<any> {
  const items = await zabbixRequest("item.get", {
    output: ["itemid", "name", "lastvalue", "lastclock", "key_", "units"],
    hostids: hostId,
    search: { key_: "sensor" },
    searchByAny: true,
  });

  const powerItems = await zabbixRequest("item.get", {
    output: ["itemid", "name", "lastvalue", "lastclock", "key_", "units"],
    hostids: hostId,
    search: { name: "power" },
    searchByAny: true,
  });

  const allItems = [...(items || []), ...(powerItems || [])];
  const seen = new Set<string>();
  const unique = allItems.filter((item: any) => {
    if (seen.has(item.itemid)) return false;
    seen.add(item.itemid);
    return true;
  });

  const watts = unique.find((i: any) =>
    i.units?.toLowerCase().includes("w") ||
    i.name?.toLowerCase().includes("watt") ||
    i.name?.toLowerCase().includes("power")
  );
  const amps = unique.find((i: any) =>
    i.units?.toLowerCase().includes("a") ||
    i.name?.toLowerCase().includes("current") ||
    i.name?.toLowerCase().includes("amp")
  );
  const volts = unique.find((i: any) =>
    i.units?.toLowerCase().includes("v") ||
    i.name?.toLowerCase().includes("voltage") ||
    i.name?.toLowerCase().includes("volt")
  );
  const kWh = unique.find((i: any) =>
    i.units?.toLowerCase().includes("kwh") ||
    i.name?.toLowerCase().includes("energy") ||
    i.name?.toLowerCase().includes("consumption")
  );

  return {
    watts: watts ? { value: parseFloat(watts.lastvalue), unit: watts.units || "W", name: watts.name } : null,
    amps: amps ? { value: parseFloat(amps.lastvalue), unit: amps.units || "A", name: amps.name } : null,
    volts: volts ? { value: parseFloat(volts.lastvalue), unit: volts.units || "V", name: volts.name } : null,
    kWh: kWh ? { value: parseFloat(kWh.lastvalue), unit: kWh.units || "kWh", name: kWh.name } : null,
    allItems: unique.map((i: any) => ({
      itemId: i.itemid,
      name: i.name,
      value: i.lastvalue,
      units: i.units,
      key: i.key_,
    })),
  };
}

export async function isZabbixConfigured(): Promise<boolean> {
  const config = await getZabbixConfig();
  return config !== null;
}

export async function testZabbixConnection(): Promise<{ success: boolean; message: string; version?: string }> {
  const config = await getZabbixConfig();
  if (!config) return { success: false, message: "Zabbix not configured" };

  const result = await zabbixRequest("apiinfo.version", []);
  if (result) {
    return { success: true, message: `Connected to Zabbix ${result}`, version: result };
  }
  return { success: false, message: "Failed to connect to Zabbix API" };
}
