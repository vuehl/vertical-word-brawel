// LinkeDOM reports the observed root as a childList target. Remember each
// node's actual parent while attached so removals can invalidate that parent,
// including detached text nodes and hidden legacy HUD elements.
export function createMutationTargets(root){
  const parents=new WeakMap();
  function remember(node){
    if(node.parentNode)parents.set(node,node.parentNode);
    for(const child of node.childNodes||[])remember(child);
  }
  remember(root);
  return record=>{
    if(record.type!=='childList')return record.target;
    const added=record.addedNodes[0],removed=record.removedNodes[0];
    let parent=(removed&&parents.get(removed))||(added?.parentNode)||record.target;
    while(!parent.isConnected&&parents.has(parent))parent=parents.get(parent);
    for(const node of record.addedNodes)remember(node);
    return parent;
  };
}
