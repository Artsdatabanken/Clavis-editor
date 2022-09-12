import React from "react";

import { Card, CardHeader, IconButton, Avatar, Typography, Chip } from '@mui/material';

import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import RestoreIcon from "@mui/icons-material/Restore";

import { getRelevantTaxaCount } from "../utils/logic";

function Taxon(props) {
  // props.taxon.vernacularName =
  //   props.taxon.vernacularName.charAt(0).toUpperCase() +
  //   props.taxon.vernacularName.slice(1);

  const { vernacularName, scientificName, id, isResult } = props.taxon;
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

  const getButton = () => {
    if (props.taxon.dismissed) {
      return (
        <IconButton
          edge="end"
          aria-label="dismiss"
          onClick={props.toggleDismissTaxon.bind(this, id)}
        >
          <RestoreIcon />
        </IconButton>
      );
    } else if (props.filter !== "irrelevant" && !props.standalone) {
      return (
        <HighlightOffIcon
          onClick={props.toggleDismissTaxon.bind(this, id)}
          style={{ color: "#aaa", paddingTop: "15px", paddingRight: "5px" }}
        />
      );
    }
    return " ";
  };

  const nameCapitalizedHeader = (
    <Typography
      variant="h2"
      style={{ fontSize: "1.12em", lineHeight: ".5em" }}
      gutterBottom
    >
      {vernacularName["en"] || vernacularName["nb"] || vernacularName["nn"]}{" "}
      {props.taxon.children &&
        !props.taxon.isResult &&
        "(" + getRelevantTaxaCount(props.taxon) + ")"}
    </Typography>
  );

  const scientificNameHeader = (
    <Typography variant="body2" gutterBottom style={{ fontSize: "0.8em" }}>
      <i>{scientificName}</i>
    </Typography>
  );

  let cardStyle = {cursor: "pointer"};
  if (props.filter === "irrelevant") {
    cardStyle.backgroundColor = "#eee";
  }
  
  return (
    <Card variant="outlined" style={cardStyle}>
      <div style={{ display: "flex" }}>
        {props.taxon.media && (
          <Avatar
            variant="square"
            src={"https://www.artsdatabanken.no/Media/" + props.taxon.media["mediaElement"]["file"]["url"]["externalId"] + "?mode=128x128"}
            style={{ width: "55px", height: "55px" }}
            onClick={props.setModal.bind(this, { taxon: props.taxon })}
          />
        )}
        <CardHeader
          style={{ paddingBottom: 0, flex: "1" }}
          disableTypography={true}
          title={nameCapitalizedHeader}
          subheader={scientificNameHeader}
          onClick={props.setModal.bind(this, { taxon: props.taxon })}
        />

        <div style={{ flex: "0" }}>{getButton()}</div>
      </div>
      <div style={{ paddingLeft: "50px" }}>
        {props.taxon.isResult &&
          children.length === 1 &&
          (children[0].vernacularName["en"] || children[0].vernacularName["nb"] || children[0].vernacularName["nn"]) && (
            <Chip
              style={{ marginLeft: 15, marginBottom: 15, marginTop: -5 }}
              size="small"
              variant="default"
              label={
                children[0].vernacularName["en"] || children[0].vernacularName["nb"] || children[0].vernacularName["nn"]
                // children[0].vernacularName.charAt(0).toUpperCase() +
                // children[0].vernacularName.slice(1)
              }
            />
          )}
      </div>
    </Card>
  );
}

export default Taxon;
