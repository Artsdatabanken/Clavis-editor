import React from "react";

import {TreeItem} from '@mui/lab';
import Taxon from "./Taxon";

function TaxonTreeItem(props) {
  const { isResult } = props.taxon;
  let media = props.taxon.media;

  let children = [];
  if (props.taxon.children) {
    if (props.filter !== "irrelevant") {
      children = props.taxon.children.filter((child) => child.isRelevant);
    } else {
      children = props.taxon.children.filter((child) => child.isIrrelevant);
    }
  }

  // If this taxon has no media, but is a result with children, set the media element to that of the first child
  if (!media && isResult && children.length) {
    let child = children.find((child) => child.media);
    if (child) {
      media = child.media;
    }
  }

  let cardStyle = {};
  if (props.filter === "irrelevant") {
    cardStyle.backgroundColor = "#eee";
  }

  return (
    <TreeItem
      nodeId={props.taxon.id + "_" + props.filter}
      onLabelClick={(e) => {
        e.preventDefault();
      }}
      label={
        <Taxon
          taxon={props.taxon}
          toggleDismissTaxon={props.toggleDismissTaxon}
          setModal={props.setModal}
          filter={props.filter}
          media={props.media}
        />
      }
    >
      {!props.taxon.isResult
        ? children.map((child) => (
            <TaxonTreeItem
              toggleDismissTaxon={props.toggleDismissTaxon}
              setModal={props.setModal}
              taxon={child}
              media={props.media}
              key={child.id}
              filter={props.filter}
            />
          ))
        : ""}
    </TreeItem>
  );
}

export default TaxonTreeItem;
