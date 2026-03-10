import { storage } from "./storage";
import https from "https";
import http from "http";

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

function zabbixHttpRequest(url: string, bodyStr: string, token?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === "https:";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Content-Length": String(Buffer.byteLength(bodyStr)),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers,
      ...(isHttps ? { rejectUnauthorized: false } : {}),
    };

    const transport = isHttps ? https : http;
    const req = transport.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 500)}`));
        } else {
          resolve(data);
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(new Error("Request timeout (15s)")); });
    req.write(bodyStr);
    req.end();
  });
}

async function zabbixRequest(method: string, params: any): Promise<any> {
  const config = await getZabbixConfig();
  if (!config) return null;

  const baseUrl = config.url.replace(/\/api_jsonrpc\.php\/?$/, "");
  const url = `${baseUrl}/api_jsonrpc.php`;

  try {
    const bodyStr = JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id: 1,
    });

    const responseText = await zabbixHttpRequest(url, bodyStr, config.token);
    const data = JSON.parse(responseText);

    if (data.error) {
      console.error("[ZABBIX] API error:", JSON.stringify(data.error));
      return null;
    }
    return data.result;
  } catch (err: any) {
    console.error(`[ZABBIX] Request failed for ${method}: ${err.message}`);
    throw err;
  }
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

export async function getZabbixAllHosts(): Promise<any[]> {
  const result = await zabbixRequest("host.get", {
    output: ["hostid", "host", "name", "status"],
    sortfield: "name",
  });
  return result || [];
}

export async function getZabbixHostItems(hostId: string): Promise<any[]> {
  const result = await zabbixRequest("item.get", {
    output: ["itemid", "name", "lastvalue", "lastclock", "key_", "units", "status"],
    hostids: hostId,
    sortfield: "name",
    limit: 500,
  });
  return (result || []).map((item: any) => ({
    itemId: item.itemid,
    name: item.name,
    key: item.key_,
    lastValue: item.lastvalue,
    units: item.units || "",
    status: item.status,
    lastUpdate: item.lastclock ? new Date(parseInt(item.lastclock) * 1000).toISOString() : null,
  }));
}

export async function getZabbixItemValues(itemIds: string[]): Promise<any[]> {
  if (itemIds.length === 0) return [];
  const result = await zabbixRequest("item.get", {
    output: ["itemid", "name", "lastvalue", "lastclock", "key_", "units"],
    itemids: itemIds,
    sortfield: "name",
  });
  return (result || []).map((item: any) => ({
    itemId: item.itemid,
    name: item.name,
    key: item.key_,
    lastValue: item.lastvalue,
    units: item.units || "",
    lastUpdate: item.lastclock ? new Date(parseInt(item.lastclock) * 1000).toISOString() : null,
  }));
}

export async function testZabbixConnection(): Promise<{ success: boolean; message: string; version?: string }> {
  const config = await getZabbixConfig();
  if (!config) return { success: false, message: "Zabbix not configured. Set the Zabbix URL and API Token in Settings > Integrations." };

  const baseUrl = config.url.replace(/\/api_jsonrpc\.php\/?$/, "");
  const url = `${baseUrl}/api_jsonrpc.php`;

  try {
    const versionBody = JSON.stringify({ jsonrpc: "2.0", method: "apiinfo.version", params: [], id: 1 });
    const versionText = await zabbixHttpRequest(url, versionBody);
    const versionData = JSON.parse(versionText);
    if (versionData.error) {
      return { success: false, message: `Zabbix API error: ${versionData.error.data || versionData.error.message}` };
    }
    const version = versionData.result;
    if (!version) {
      return { success: false, message: "Zabbix API returned no version. Check the URL." };
    }

    const authBody = JSON.stringify({ jsonrpc: "2.0", method: "host.get", params: { limit: 1, output: ["hostid"] }, id: 2 });
    const authText = await zabbixHttpRequest(url, authBody, config.token);
    const authData = JSON.parse(authText);
    if (authData.error) {
      return { success: false, message: `Zabbix v${version} reachable, but token is invalid: ${authData.error.data || authData.error.message}` };
    }

    return { success: true, message: `Connected to Zabbix ${version}`, version };
  } catch (err: any) {
    const msg = err.message || String(err);
    if (msg.includes("UNABLE_TO_VERIFY") || msg.includes("self-signed") || msg.includes("certificate")) {
      return { success: false, message: `TLS certificate error: ${msg}. The app accepts self-signed certs — check if the URL is correct.` };
    }
    if (msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND")) {
      return { success: false, message: `Cannot reach Zabbix server: ${msg}. Verify the URL is accessible from this server.` };
    }
    if (msg.includes("ETIMEDOUT") || msg.includes("timeout")) {
      return { success: false, message: `Connection timed out: ${msg}. Check network/firewall rules.` };
    }
    return { success: false, message: `Zabbix connection error: ${msg}` };
  }
}
