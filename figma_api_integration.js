/**
 * Figma API Integration - Roommate Hub Project
 * Fetch design data, components, and assets from Figma
 */

// ==========================================
// 1. FIGMA API SETUP
// ==========================================

const FIGMA_API_TOKEN = "YOUR_FIGMA_API_TOKEN"; // Get from figma.com/developers
const FILE_KEY = "ZWao0P1hhSdooRsUrioHZQ"; // From your URL
const NODE_IDS = {
  header: "6:623",
  actionBar: "6:60",
  roommateCard: "6:95",
  analyticsSection: "6:382",
  vibeSelector: "6:472",
  timeline: "6:551",
};

const FIGMA_API_BASE = "https://api.figma.com/v1";

// ==========================================
// 2. FETCH FILE METADATA
// ==========================================

async function getFigmaFile() {
  try {
    const response = await fetch(`${FIGMA_API_BASE}/files/${FILE_KEY}`, {
      headers: {
        "X-Figma-Token": FIGMA_API_TOKEN,
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Figma File Metadata:", data);
    return data;
  } catch (error) {
    console.error("❌ Failed to fetch Figma file:", error.message);
  }
}

// ==========================================
// 3. FETCH SPECIFIC NODE/COMPONENT
// ==========================================

async function getFigmaNode(nodeId) {
  try {
    const response = await fetch(
      `${FIGMA_API_BASE}/files/${FILE_KEY}/nodes?ids=${nodeId}`,
      {
        headers: {
          "X-Figma-Token": FIGMA_API_TOKEN,
        },
      }
    );

    const data = await response.json();
    console.log(`✅ Node ${nodeId}:`, data);
    return data;
  } catch (error) {
    console.error(`❌ Failed to fetch node ${nodeId}:`, error.message);
  }
}

// ==========================================
// 4. FETCH ALL COMPONENTS
// ==========================================

async function getAllComponents() {
  try {
    const response = await fetch(`${FIGMA_API_BASE}/files/${FILE_KEY}/components`, {
      headers: {
        "X-Figma-Token": FIGMA_API_TOKEN,
      },
    });

    const data = await response.json();
    console.log("✅ All Components:", data);
    return data.components;
  } catch (error) {
    console.error("❌ Failed to fetch components:", error.message);
  }
}

// ==========================================
// 5. EXPORT COMPONENT AS IMAGE
// ==========================================

async function exportComponentAsImage(nodeId, format = "png", scale = 2) {
  try {
    const response = await fetch(
      `${FIGMA_API_BASE}/files/${FILE_KEY}/export?ids=${nodeId}&format=${format}&scale=${scale}`,
      {
        headers: {
          "X-Figma-Token": FIGMA_API_TOKEN,
        },
      }
    );

    const data = await response.json();
    console.log(`✅ Export URL for ${nodeId}:`, data.images);
    return data.images;
  } catch (error) {
    console.error("❌ Failed to export component:", error.message);
  }
}

// ==========================================
// 6. FETCH DESIGN TOKENS (Colors, Typography)
// ==========================================

async function extractDesignTokens() {
  try {
    const response = await fetch(
      `${FIGMA_API_BASE}/files/${FILE_KEY}?depth=2`,
      {
        headers: {
          "X-Figma-Token": FIGMA_API_TOKEN,
        },
      }
    );

    const data = await response.json();
    const tokens = extractTokensFromNodes(data.document.children);
    console.log("✅ Design Tokens:", tokens);
    return tokens;
  } catch (error) {
    console.error("❌ Failed to extract tokens:", error.message);
  }
}

function extractTokensFromNodes(nodes, tokens = {}) {
  for (let node of nodes) {
    // Extract colors
    if (node.fills) {
      node.fills.forEach((fill) => {
        if (fill.type === "SOLID") {
          const hex = rgbToHex(fill.color);
          tokens[node.name] = hex;
        }
      });
    }

    // Extract typography
    if (node.style) {
      tokens[node.name] = {
        fontFamily: node.style.fontFamily,
        fontSize: node.style.fontSize,
        fontWeight: node.style.fontWeight,
      };
    }

    // Recursive search
    if (node.children) {
      extractTokensFromNodes(node.children, tokens);
    }
  }
  return tokens;
}

// ==========================================
// 7. CONVERT RGB TO HEX
// ==========================================

function rgbToHex(rgb) {
  const r = Math.round(rgb.r * 255)
    .toString(16)
    .padStart(2, "0");
  const g = Math.round(rgb.g * 255)
    .toString(16)
    .padStart(2, "0");
  const b = Math.round(rgb.b * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${r}${g}${b}`;
}

// ==========================================
// 8. FETCH PROTOTYPING & INTERACTIONS
// ==========================================

async function getPrototypeData() {
  try {
    const response = await fetch(
      `${FIGMA_API_BASE}/files/${FILE_KEY}?depth=3`,
      {
        headers: {
          "X-Figma-Token": FIGMA_API_TOKEN,
        },
      }
    );

    const data = await response.json();
    console.log("✅ Prototype Data:", data);
    return data;
  } catch (error) {
    console.error("❌ Failed to fetch prototype:", error.message);
  }
}

// ==========================================
// 9. BATCH FETCH MULTIPLE NODES
// ==========================================

async function batchFetchNodes(nodeIds) {
  try {
    const idString = nodeIds.join(",");
    const response = await fetch(
      `${FIGMA_API_BASE}/files/${FILE_KEY}/nodes?ids=${idString}`,
      {
        headers: {
          "X-Figma-Token": FIGMA_API_TOKEN,
        },
      }
    );

    const data = await response.json();
    console.log("✅ Batch Fetch Result:", data);
    return data.nodes;
  } catch (error) {
    console.error("❌ Failed batch fetch:", error.message);
  }
}

// ==========================================
// 10. COMPLETE WORKFLOW - GET EVERYTHING
// ==========================================

async function completeDesignSync() {
  console.log("🚀 Starting Figma Design Sync...\n");

  // Step 1: Fetch file metadata
  console.log("📋 Step 1: Fetching file metadata...");
  const fileData = await getFigmaFile();

  // Step 2: Fetch all components
  console.log("\n🎨 Step 2: Fetching all components...");
  const components = await getAllComponents();

  // Step 3: Batch fetch specific nodes
  console.log("\n📦 Step 3: Fetching specific sections...");
  const nodeIds = Object.values(NODE_IDS);
  const nodes = await batchFetchNodes(nodeIds);

  // Step 4: Extract design tokens
  console.log("\n🎨 Step 4: Extracting design tokens...");
  const tokens = await extractDesignTokens();

  // Step 5: Export components as images
  console.log("\n🖼️ Step 5: Exporting components as images...");
  for (const [name, nodeId] of Object.entries(NODE_IDS)) {
    await exportComponentAsImage(nodeId);
  }

  console.log("\n✅ Sync complete!");

  return {
    fileData,
    components,
    nodes,
    tokens,
  };
}

// ==========================================
// USAGE EXAMPLES
// ==========================================

// Run all:
// completeDesignSync();

// Or run individually:
// getFigmaFile();
// getFigmaNode("6:60");
// getAllComponents();
// exportComponentAsImage("6:95", "png", 2);
// extractDesignTokens();

// ==========================================
// ALTERNATIVE: Using Figma REST API Client
// ==========================================

class FigmaClient {
  constructor(apiToken, fileKey) {
    this.apiToken = apiToken;
    this.fileKey = fileKey;
    this.baseURL = "https://api.figma.com/v1";
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "X-Figma-Token": this.apiToken,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Figma API Error: ${response.status}`);
    }

    return response.json();
  }

  async getFile() {
    return this.request(`/files/${this.fileKey}`);
  }

  async getNode(nodeId) {
    return this.request(`/files/${this.fileKey}/nodes?ids=${nodeId}`);
  }

  async getComponents() {
    return this.request(`/files/${this.fileKey}/components`);
  }

  async exportNode(nodeId, format = "png", scale = 2) {
    return this.request(
      `/files/${this.fileKey}/export?ids=${nodeId}&format=${format}&scale=${scale}`
    );
  }

  async getTeamComponents(teamId) {
    return this.request(`/teams/${teamId}/components`);
  }
}

// Usage:
// const client = new FigmaClient("YOUR_TOKEN", "ZWao0P1hhSdooRsUrioHZQ");
// client.getFile().then(data => console.log(data));

// ==========================================
// EXPORT FOR USE IN NODE.JS / REACT
// ==========================================

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    getFigmaFile,
    getFigmaNode,
    getAllComponents,
    exportComponentAsImage,
    extractDesignTokens,
    batchFetchNodes,
    completeDesignSync,
    FigmaClient,
  };
}
