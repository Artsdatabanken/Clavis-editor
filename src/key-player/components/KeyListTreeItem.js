import React from "react";
import TreeItem from "@material-ui/lab/TreeItem";
import KeyInfo from "./KeyInfo";

function KeyListTreeItem(props) {
  let { treeItem } = props;
  let key = props.keys.find((k) => k.id === treeItem.id);

  return (
    <TreeItem
      nodeId={treeItem.id}
      key={treeItem.id}
      label={<KeyInfo key={treeItem.id} keyItem={key} />}
    >
      {treeItem.keys &&
        treeItem.keys.map((child) => (
          <KeyListTreeItem key={child.id} treeItem={child} keys={props.keys} />
        ))}
    </TreeItem>
  );
}

export default KeyListTreeItem;
