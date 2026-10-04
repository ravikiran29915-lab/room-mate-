#!/usr/bin/env python3
"""
Figma API Integration - Python Version
Sync your Figma design with your React/Node project
"""

import os
import json
import requests
from typing import Dict, List, Optional
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

FIGMA_API_TOKEN = os.getenv("FIGMA_API_TOKEN")
FIGMA_FILE_KEY = "ZWao0P1hhSdooRsUrioHZQ"
FIGMA_API_BASE = "https://api.figma.com/v1"

# Component Node IDs for Roommate Hub
NODE_IDS = {
    "header": "6:623",
    "actionBar": "6:60",
    "roommateCard": "6:95",
    "analyticsSection": "6:382",
    "vibeSelector": "6:472",
    "timeline": "6:551",
    "footer": "6:605",
    "navigation": "6:648",
}


class FigmaClient:
    """
    Figma API Client for Python
    """

    def __init__(self, api_token: str, file_key: str):
        self.api_token = api_token
        self.file_key = file_key
        self.base_url = FIGMA_API_BASE
        self.headers = {"X-Figma-Token": api_token}

    def get_file(self) -> Dict:
        """Fetch file metadata"""
        url = f"{self.base_url}/files/{self.file_key}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def get_node(self, node_id: str) -> Dict:
        """Fetch specific node"""
        url = f"{self.base_url}/files/{self.file_key}/nodes?ids={node_id}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def get_nodes_batch(self, node_ids: List[str]) -> Dict:
        """Fetch multiple nodes at once"""
        id_string = ",".join(node_ids)
        url = f"{self.base_url}/files/{self.file_key}/nodes?ids={id_string}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def get_components(self) -> Dict:
        """Fetch all components"""
        url = f"{self.base_url}/files/{self.file_key}/components"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def export_node(
        self, node_id: str, format: str = "png", scale: int = 2
    ) -> Dict:
        """Export component as image"""
        url = f"{self.base_url}/files/{self.file_key}/export?ids={node_id}&format={format}&scale={scale}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def get_design_tokens(self) -> Dict:
        """Extract design tokens (colors, typography)"""
        file_data = self.get_file()
        tokens = {}

        def extract_from_node(node, path=""):
            """Recursively extract tokens from nodes"""
            node_name = node.get("name", "")
            node_path = f"{path}/{node_name}" if path else node_name

            # Extract fills (colors)
            if "fills" in node:
                for fill in node["fills"]:
                    if fill.get("type") == "SOLID":
                        color = fill.get("color", {})
                        hex_color = self._rgb_to_hex(color)
                        tokens[node_path] = {"type": "color", "value": hex_color}

            # Extract text properties (typography)
            if "style" in node:
                style = node["style"]
                tokens[node_path] = {
                    "type": "typography",
                    "fontFamily": style.get("fontFamily"),
                    "fontSize": style.get("fontSize"),
                    "fontWeight": style.get("fontWeight"),
                }

            # Recursively process children
            if "children" in node:
                for child in node["children"]:
                    extract_from_node(child, node_path)

        # Start extraction from document
        if "document" in file_data:
            extract_from_node(file_data["document"])

        return tokens

    @staticmethod
    def _rgb_to_hex(rgb: Dict) -> str:
        """Convert RGB dict to hex color"""
        r = int(rgb.get("r", 0) * 255)
        g = int(rgb.get("g", 0) * 255)
        b = int(rgb.get("b", 0) * 255)
        return f"#{r:02x}{g:02x}{b:02x}"


# ==========================================
# UTILITY FUNCTIONS
# ==========================================


def print_header(text: str):
    """Pretty print header"""
    print(f"\n{'=' * 50}")
    print(f"  {text}")
    print(f"{'=' * 50}\n")


def save_json(data: Dict, filename: str):
    """Save data to JSON file"""
    with open(filename, "w") as f:
        json.dump(data, f, indent=2)
    print(f"✅ Saved to {filename}")


def export_tailwind_config(tokens: Dict):
    """Generate Tailwind config from design tokens"""
    colors = {}
    spacing = {}

    for key, value in tokens.items():
        if isinstance(value, dict) and value.get("type") == "color":
            # Clean up key name
            clean_key = key.split("/")[-1].lower().replace(" ", "-")
            colors[clean_key] = value["value"]

    config = {
        "theme": {
            "colors": colors,
            "extend": {
                "fontFamily": {
                    "jakarta": "'Plus Jakarta Sans', sans-serif",
                    "inter": "'Inter', sans-serif",
                }
            },
        },
    }

    return config


# ==========================================
# MAIN WORKFLOW
# ==========================================


def sync_figma_design():
    """Complete workflow to sync Figma design"""

    if not FIGMA_API_TOKEN:
        print("❌ Error: FIGMA_API_TOKEN not set in .env")
        return

    print("🚀 Starting Figma Design Sync...\n")
    client = FigmaClient(FIGMA_API_TOKEN, FIGMA_FILE_KEY)

    try:
        # Step 1: Get file metadata
        print_header("Step 1: Fetching File Metadata")
        file_data = client.get_file()
        print(f"File Name: {file_data['name']}")
        print(f"Last Modified: {file_data['lastModified']}")
        save_json(file_data, "figma_file_metadata.json")

        # Step 2: Get all components
        print_header("Step 2: Fetching Components")
        components = client.get_components()
        print(f"Found {len(components.get('components', []))} components")
        save_json(components, "figma_components.json")

        # Step 3: Batch fetch specific nodes
        print_header("Step 3: Fetching Component Nodes")
        node_ids = list(NODE_IDS.values())
        nodes = client.get_nodes_batch(node_ids)
        print(f"Fetched {len(nodes.get('nodes', {}))} nodes")
        save_json(nodes, "figma_nodes.json")

        # Step 4: Extract design tokens
        print_header("Step 4: Extracting Design Tokens")
        tokens = client.get_design_tokens()
        print(f"Extracted {len(tokens)} design tokens")
        save_json(tokens, "figma_design_tokens.json")

        # Step 5: Generate Tailwind config
        print_header("Step 5: Generating Tailwind Config")
        tailwind_config = export_tailwind_config(tokens)
        save_json(tailwind_config, "tailwind_config_from_figma.json")

        # Step 6: Export components as images
        print_header("Step 6: Exporting Components as Images")
        exports = {}
        for name, node_id in NODE_IDS.items():
            print(f"  Exporting {name}...")
            export_data = client.export_node(node_id)
            exports[name] = export_data
            time.sleep(0.5)  # Rate limiting

        save_json(exports, "figma_exports.json")

        print_header("✅ Sync Complete!")
        print("📁 Generated Files:")
        print("  - figma_file_metadata.json")
        print("  - figma_components.json")
        print("  - figma_nodes.json")
        print("  - figma_design_tokens.json")
        print("  - tailwind_config_from_figma.json")
        print("  - figma_exports.json")

    except requests.exceptions.HTTPError as e:
        print(f"❌ HTTP Error: {e}")
        print("Check your API token and file key")
    except Exception as e:
        print(f"❌ Error: {e}")


# ==========================================
# CLI COMMANDS
# ==========================================


def main():
    """CLI main menu"""
    import sys

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "sync":
            sync_figma_design()
        elif command == "file":
            client = FigmaClient(FIGMA_API_TOKEN, FIGMA_FILE_KEY)
            print_header("File Metadata")
            print(json.dumps(client.get_file(), indent=2))
        elif command == "components":
            client = FigmaClient(FIGMA_API_TOKEN, FIGMA_FILE_KEY)
            print_header("Components")
            print(json.dumps(client.get_components(), indent=2))
        elif command == "tokens":
            client = FigmaClient(FIGMA_API_TOKEN, FIGMA_FILE_KEY)
            print_header("Design Tokens")
            print(json.dumps(client.get_design_tokens(), indent=2))
        elif command == "export":
            client = FigmaClient(FIGMA_API_TOKEN, FIGMA_FILE_KEY)
            node_id = sys.argv[2] if len(sys.argv) > 2 else "6:95"
            print_header(f"Exporting Node {node_id}")
            print(json.dumps(client.export_node(node_id), indent=2))
        else:
            print("Unknown command")
    else:
        print("Figma Design Sync CLI")
        print("\nUsage:")
        print("  python figma_sync.py sync           # Full sync")
        print("  python figma_sync.py file           # Get file info")
        print("  python figma_sync.py components     # List components")
        print("  python figma_sync.py tokens         # Extract tokens")
        print("  python figma_sync.py export [id]    # Export node")
        print("\nExample:")
        print("  python figma_sync.py export 6:95")


if __name__ == "__main__":
    main()
