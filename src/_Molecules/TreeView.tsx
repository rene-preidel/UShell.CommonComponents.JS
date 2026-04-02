import React, { useMemo, useState, useEffect } from 'react'
import ChevrodnDownIcon from '../_Icons/ChevrodnDownIcon'

export type ExpandTrigger = 'icon' | 'row';


class TreeNode {
  id: any
  children: TreeNode[] = []
  name: string = ''
  type: 'folder' | 'file' = 'file'
  render: (column: string, data?: TreeNodeRenderData) => JSX.Element = () => <div>{this.name}</div>
  onSelected?: () => void = () => {}
  onContextMenu?: (event: React.MouseEvent) => void
}

class TreeNodeRenderData {
  name: string = ''
  isHovered: boolean = false
  isSelected: boolean = false
}

function pushIntoNodes(
  nodes: TreeNode[],
  path: string[],
  d: any,
  keyField: string,
  currentPath: string,
  renderColumn?: (d: any, c: string) => JSX.Element,
) {
  if (path.length == 0) {
    nodes.push({
      id: d[keyField],
      name: d[keyField],
      children: [],
      render: renderColumn
        ? (c: string) => renderColumn(d, c)
        : (c: string) => <div>{d[keyField]}</div>,
      type: 'file',
      onSelected: () => {},
      onContextMenu: () => {}
    })
    return
  }
  const currentPathEntry = path[0]
  const remainingPath: string[] = path.slice(1)
  let existingNode: TreeNode | undefined = nodes.find((n) => n.name == currentPathEntry)
  currentPath = currentPath += '/' + currentPathEntry
  if (!existingNode) {
    existingNode = {
      name: currentPathEntry,
      children: [],
      id: currentPath,
      render: (c: string) => <div>{c}</div>,
      type: remainingPath.length > 0 ? 'folder' : 'file',
      onSelected: () => {},
      onContextMenu: () => {}
    }
    nodes.push(existingNode)
  }
  pushIntoNodes(existingNode.children, remainingPath, d, keyField, currentPath, renderColumn)
}

export const TreeView1: React.FC<{
  data: any[]
  pathField: string
  keyField: string
  renderColumn?: (d: any, c: string) => JSX.Element
}> = ({ data, pathField, keyField, renderColumn }) => {
  const nodes = useMemo(() => {
    const result: TreeNode[] = []
    data.forEach((d) => {
      const path: string[] = d[pathField].split('/')
      pushIntoNodes(result, path, d, keyField, '', renderColumn)
    })
    return result
  }, [data])
  return <TreeView nodes={nodes}></TreeView>
}

const TreeView: React.FC<{
  nodes: TreeNode[]
  onNodeSelected?: (n: TreeNode) => void,
  indentationPerLevelInPx?: number,
  expandTrigger?: ExpandTrigger,
  selectedNode?: string | null,
  setSelectedNode?: (n: string | null) => void
}> = ({ nodes, onNodeSelected, indentationPerLevelInPx = 30, expandTrigger = 'row', selectedNode: externalSelectedNode, setSelectedNode: externalSetSelectedNode }) => {
  
  const [internalSelectedNode, internalSetSelectedNode] = useState<string | null>(null)
  const selectedNode = externalSelectedNode ?? internalSelectedNode
  const setSelectedNode = externalSetSelectedNode ?? internalSetSelectedNode
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [focusedNode, setFocusedNode] = useState<string | null>(null);
  const [close, setClose] = useState<{ [n: string]: Boolean }>({})
  
  const flatNodes: TreeNode[] = useMemo(() => {
    const result: TreeNode[] = [];
    const flattenNodes = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        result.push(node);
        if (node.children.length > 0) {
          flattenNodes(node.children);
        }
      });
    };
    flattenNodes(nodes);
    return result;
  }, [nodes]);

  function onNodeSelectedX(n: TreeNode, shouldSelect: boolean, shouldToggle: boolean) {
    if (shouldSelect) {
      setSelectedNode(n.id)
      if (n.onSelected) {
        n.onSelected()
      } else {
        if (onNodeSelected) {
          onNodeSelected(n)
        }
      }
    }
  
    if (!shouldToggle) return
    const newClose = { ...close }
    newClose[n.id] = !newClose[n.id]
    setClose(newClose)
  }

  useEffect(() => {
    if (externalSelectedNode) {
      const selectedTreeNode = flatNodes.find((n) => n.id === externalSelectedNode);
      if (selectedTreeNode) {
        onNodeSelectedX(selectedTreeNode, true, false);
      }
    }
  }, [externalSelectedNode, flatNodes, onNodeSelected]);

  return (
    <div 
      className='contents'
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setFocusedNode(null);
        }
      }}
    >
      <TreeViewInner
        depth={0}
        nodes={nodes}
        flatNodes={flatNodes}
        close={close}
        setClose={setClose}
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
        onTreeNodeSelected={onNodeSelectedX}
        hoveredNode={hoveredNode}
        setHoveredNode={setHoveredNode}
        focusedNode={focusedNode}
        setFocusedNode={setFocusedNode}
        indentationPerLevelInPx={indentationPerLevelInPx}
        expandTrigger={expandTrigger}
      ></TreeViewInner>
    </div>
  )
}

const TreeViewInner: React.FC<{
  nodes: TreeNode[]
  flatNodes: TreeNode[]
  depth: number
  close: { [n: string]: Boolean }
  setClose: (c: { [n: string]: Boolean }) => void,
  selectedNode: string | null
  setSelectedNode: (n: string | null) => void,
  hoveredNode: string | null
  setHoveredNode: (n: string | null) => void,
  focusedNode: string | null
  setFocusedNode: (n: string | null) => void,
  onTreeNodeSelected: (n: TreeNode, shouldSelect: boolean, shouldToggle: boolean) => void,
  indentationPerLevelInPx: number,
  expandTrigger?: ExpandTrigger
}> = ({ nodes, flatNodes, depth, close, setClose, selectedNode, setSelectedNode, hoveredNode, setHoveredNode, focusedNode, setFocusedNode, onTreeNodeSelected, indentationPerLevelInPx, expandTrigger }) => {

  function isInCollapsedTree(n: TreeNode): boolean {
    for (const potentialParent of flatNodes) {
      if (potentialParent.children.some(c => c.id === n.id)) {
        if (close[potentialParent.id]) {
          return true;
        } else {
          return isInCollapsedTree(potentialParent);
        }
      }
    }
    return false;
  }

  function isNodeInSubtree(rootNode?: TreeNode, targetNode?: TreeNode): boolean {
    if (!rootNode || !targetNode) return false;
    if (rootNode.children.some(child => child.id === targetNode.id)) {
      return true;
    }
    for (const child of rootNode.children) {
      if (isNodeInSubtree(child, targetNode)) {
        return true;
      }
    }
    return false;
  }

  return (
    <div
      className='text-sm border-0 h-full w-full'
      onClick={(e) => {
        setSelectedNode(null)
      }}
      onKeyDown={(e) => {
        if (depth !== 0) return;

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const currentIndex = flatNodes.findIndex((n) => n.id === (focusedNode ?? selectedNode));
          if (currentIndex >= 0) {
            let nextIndex = currentIndex + 1;
            while (nextIndex < flatNodes.length && isInCollapsedTree(flatNodes[nextIndex])) {
              nextIndex++;
            }
            if (nextIndex >= flatNodes.length) return;
            const nextNode = flatNodes[nextIndex];
            // onNodeSelected(nextNode, false);
            setFocusedNode(nextNode.id);
            const nextNodeElement = document.querySelector(`[data-node-id="${nextNode.id}"]`);
            if (nextNodeElement instanceof HTMLElement) {
              nextNodeElement.focus();
            }
          }
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          const currentIndex = flatNodes.findIndex((n) => n.id === (focusedNode ?? selectedNode));
          if (currentIndex > 0) {
            let nextIndex = currentIndex - 1;
            while (nextIndex > 0 && isInCollapsedTree(flatNodes[nextIndex])) {
              nextIndex--;
            }
            if (nextIndex < 0) return;
            const prevNode = flatNodes[nextIndex];
            // onNodeSelected(prevNode, false);
            setFocusedNode(prevNode.id);
            const prevNodeElement = document.querySelector(`[data-node-id="${prevNode.id}"]`);
            if (prevNodeElement instanceof HTMLElement) {
              prevNodeElement.focus();
            }
          }
          return;
        }

        // handling arrow keys from here
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        const currentIndex = flatNodes.findIndex((n) => n.id === (focusedNode ?? selectedNode));
        const currentNode = flatNodes[currentIndex];
        if (!currentNode) return;
        
        // toggle expand/collapse
        if (currentNode.type === 'folder' && (
            (e.key === 'ArrowLeft' && !close[currentNode.id])
            || (e.key === 'ArrowRight' && close[currentNode.id])
          )
        ) {
          onTreeNodeSelected(
            currentNode,
            isNodeInSubtree(currentNode, flatNodes.find(n => n.id === selectedNode)) ,
            true
          );
          return;
        }

        // else select first child node on arrow right
        if (currentNode.type === 'folder' && e.key === 'ArrowRight') {
          const childNode = currentNode.children[0];
          if (!childNode) return;
            setFocusedNode(currentNode.children[0].id);
          const childNodeElement = document.querySelector(`[data-node-id="${childNode.id}"]`);
          if (childNodeElement instanceof HTMLElement) {
            childNodeElement.focus();
          }
        }

        // else select parent node on arrow left
        if (e.key === 'ArrowLeft') {
          const parentNode = flatNodes.find((n) => n.children.some(c => c.id === currentNode.id));
          if (!parentNode) return;
          // onNodeSelected(parentNode, false);
          setFocusedNode(parentNode.id);
          const parentNodeElement = document.querySelector(`[data-node-id="${parentNode.id}"]`);
          if (parentNodeElement instanceof HTMLElement) {
            parentNodeElement.focus();
          }
        }
      }}
    >
      {nodes.map((n: TreeNode, i) => (
        <div key={i} className='flex flex-col'>
          <div
            className={`border-b-0 border-navigationBorder dark:border-navigationBorderDark`}
            tabIndex={0}
            data-node-id={n.id} // Add data attribute for focus management
            onClick={(e) => {
              e.stopPropagation()
              onTreeNodeSelected(n, true, expandTrigger === 'row' && n.type === 'folder');
              setFocusedNode(null);
            }}
            onContextMenu={(e) => {
              if (n?.onContextMenu) {
                n.onContextMenu(e);
              }
            }}
            onFocus={() => setFocusedNode(n.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onTreeNodeSelected(n, true, false);
              }
            }}
          >
            <div
              className={`flex gap-2 p-2.5 ${
                selectedNode == n.id
                  ? 'bg-[var(--primary-300)]'
                  : hoveredNode === n.id || focusedNode === n.id
                    ? 'bg-navigationHover dark:bg-navigationHoverDark'
                    : 'hover:bg-navigationHover dark:hover:bg-navigationHoverDark'
              }`}
              style={{ paddingLeft: depth * indentationPerLevelInPx }}
              onMouseEnter={() => setHoveredNode(n.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {n.children && n.children.length > 0 && (
                <button
                  title="Expand/Collapse"
                  type="button"
                  className={`flex-none ${n.children && n.children.length > 0 ? 'ml-2' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onTreeNodeSelected(
                      n,
                      isNodeInSubtree(n, flatNodes.find(n => n.id === selectedNode)) ,
                      true
                    );
                  }}
                >
                  <ChevrodnDownIcon
                    size={0.8}
                    strokeWidth={5}
                    rotate={close[n.id] ? 270 : 360}
                  ></ChevrodnDownIcon>
                </button>
              )}
              <div
                className={`flex-grow select-none overflow-hidden text-ellipsis whitespace-nowrap ${n.children.length > 0 ? 'font-bold' : 'pl-2'}`}
              >
                {n.render(n.name, { name: n.name, isHovered: hoveredNode === n.id || focusedNode === n.id, isSelected: selectedNode === n.id } as TreeNodeRenderData)}
              </div>
            </div>
          </div>
          {!close[n.id] && n.children.length > 0 && (
            <div className=''>
              <TreeViewInner
                nodes={n.children}
                flatNodes={flatNodes}
                depth={depth + 1}
                close={close}
                setClose={setClose}
                selectedNode={selectedNode}
                setSelectedNode={setSelectedNode}
                hoveredNode={hoveredNode}
                setHoveredNode={setHoveredNode}
                focusedNode={focusedNode}
                setFocusedNode={setFocusedNode}
                onTreeNodeSelected={onTreeNodeSelected}
                indentationPerLevelInPx={indentationPerLevelInPx}
                expandTrigger={expandTrigger}
              ></TreeViewInner>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default TreeView
export { TreeNode, TreeNodeRenderData }
