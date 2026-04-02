import React from "react";
import { TreeNode } from "../_Molecules/TreeView";

export function useStateDebugger(initialValue: any, name: string = "") {
  const [state, setState] = React.useState(initialValue);

  const debugSetState = (value: any) => {
    debugger;
    setState(value);
  };

  return [state, debugSetState];
}

export function useStateLogger<T>(initialValue: T, name: string = ""): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState<T>(initialValue);

  const debugSetState: React.Dispatch<React.SetStateAction<T>> = (value: any) => {
    console.log(`setState(${name}): '${value}'`);
    setState(value);
  };

  return [state, debugSetState];
}

export function flattenTreeNodes(nodes: TreeNode[]): TreeNode[] {
  const flattenTreeNodesRecursive = (nodes: TreeNode[]): TreeNode[] => {
    let result: TreeNode[] = [];
    nodes.forEach((node) => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        result = result.concat(flattenTreeNodesRecursive(node.children));
      }
    });
    return result;
  };
  const flatNodes = flattenTreeNodesRecursive(nodes);
  return flatNodes;
}