import React, { useState, useEffect } from "react";
import Typography from "@material-ui/core/Typography";

import TreeView from "@material-ui/lab/TreeView";
import TreeItem from "@material-ui/lab/TreeItem";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import RemoveCircleIcon from "@material-ui/icons/RemoveCircle";

import SearchBox from "./SearchBox";
import KeyInfo from "./KeyInfo";
import KeyListTreeItem from "./KeyListTreeItem";

function KeyList(props) {
  const [filterTaxon, setfilterTaxon] = useState(false);
  const [keys, setKeys] = useState(false);
  const [expanded, setExpanded] = useState([]);

  const applyFilter = (taxon) => {
    setfilterTaxon(taxon);

    if (taxon) {
      setKeys({
        exact: props.keys.filter(
          (k) =>
            +k.classification[k.classification.length - 1].ScientificNameId ===
            +taxon.ScientificNameId
        ),
        isSubTaxon: props.keys.filter((k) =>
          k.classification
            .slice(0, k.classification.length - 1)
            .find((x) => +x.ScientificNameId === +taxon.ScientificNameId)
        ),

        containsSubTaxon: props.keys.filter((k) =>
          k.subTaxa.find((x) => +x.ScientificNameId === +taxon.ScientificNameId)
        ),

        containsResult: props.keys.filter((k) =>
          k.resultTaxa.find((x) => +x === +taxon.ScientificNameId)
        ),
      });
    } else {
      setKeys(false);
    }
  };

  const handleToggle = (event, nodeIds) => {
    setExpanded(nodeIds);
  };

  useEffect(() => {
    setExpanded(
      props.keys
        .map((k) => k.id)
        .concat(props.tree.map((phylum) => "phylum" + phylum.ScientificNameId))
    );
  }, [props.keys, props.tree]);

  return (
    <main style={{ width: "100%" }}>
      <div style={{ padding: 25 }}>
        <Typography
          variant="h3"
          component="h3"
          style={{
            display: "flex",
            fontSize: "2em",
            paddingBottom: 20,
          }}
        >
          Velg en nøkkel
        </Typography>

        <SearchBox applyFilter={applyFilter} />

        {keys &&
          !keys.exact.length &&
          !keys.containsSubTaxon.length &&
          !keys.isSubTaxon.length &&
          !keys.containsResult.length && (
            <Typography variant="overline" display="block">
              Ingen resultater for {filterTaxon.ScientificName}
            </Typography>
          )}

        {!keys && (
          <TreeView
            defaultCollapseIcon={<RemoveCircleIcon />}
            defaultExpandIcon={<AddCircleIcon />}
            expanded={expanded}
            onNodeToggle={handleToggle}
            disableSelection={true}
          >
            {props.tree.map((phylum) => (
              <TreeItem
                nodeId={"phylum" + phylum.ScientificNameId}
                key={phylum.ScientificNameId}
                label={
                  <Typography variant="h5" component="h5">
                    {phylum["VernacularName_nb-NO"][0].toUpperCase()}
                    {phylum["VernacularName_nb-NO"].slice(1).toLowerCase()}
                  </Typography>
                }
              >
                {phylum.keys.map((key) => (
                  <KeyListTreeItem
                    key={key.id}
                    treeItem={key}
                    keys={props.keys}
                  />
                ))}
              </TreeItem>
            ))}
          </TreeView>
        )}

        {keys &&
          keys.exact.map((key) => (
            <KeyInfo key={key.id} keyItem={key} subject={filterTaxon} />
          ))}

        {keys &&
          keys.containsSubTaxon.map((key) => (
            <KeyInfo key={key.id} keyItem={key} lowerTaxon={filterTaxon} />
          ))}

        {keys &&
          keys.isSubTaxon.map((key) => (
            <KeyInfo key={key.id} keyItem={key} higherTaxon={filterTaxon} />
          ))}

        {keys &&
          keys.containsResult.map((key) => (
            <KeyInfo key={key.id} keyItem={key} result={filterTaxon} />
          ))}
      </div>
    </main>
  );
}

export default KeyList;
