import React from "react";

import { Card, CardHeader, IconButton, Avatar, Typography, Chip } from '@mui/material';

import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import RestoreIcon from "@mui/icons-material/Restore";

import { getRelevantTaxaCount } from "../utils/logic";
import { capitalize, getImgSrc} from "../utils/helpers";

function Taxon(props) {
  const { vernacularName, scientificName, id, label} = props.taxon;
  let media = props.taxon.media;
  let language = props.language

  let children = [];
  if (props.taxon.children) {
    if (props.filter !== "irrelevant") {
      children = props.taxon.children.filter((child) => child.isRelevant);
    } else {
      children = props.taxon.children.filter((child) => child.isIrrelevant);
    }
  }

  // If this taxon has no media, but is a result with children, set the media element to that of the first child
  if (!media && children.length) {
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
      {
        !!vernacularName && !!vernacularName[language] ? 
          capitalize(vernacularName[language])
        : 
        (
          !!scientificName ?
            <i>{scientificName}</i>
          :
          (
            !!label ? 
            label[language]
            :
              ""
            )
        )
      }

      {!!props.taxon.children && !!props.taxon.children.length &&
        !props.taxon.children[0].label &&
        " (" + getRelevantTaxaCount(props.taxon) + ")"}
    </Typography>
  );

  const scientificNameHeader = (
    <Typography variant="body2" gutterBottom style={{ fontSize: "0.8em" }}>
      {
        ((!!vernacularName && !!vernacularName[language]) || !!label) &&
        <i>{scientificName}</i>
      }
    </Typography>
  );

  let cardStyle = { cursor: "pointer" };
  if (props.filter === "irrelevant") {
    cardStyle.backgroundColor = "#eee";
  }

  return (
    <Card variant="outlined" style={cardStyle}>
      <div style={{ display: "flex" }}>
        {props.taxon.media && (
          <Avatar
            variant="square"
            src={getImgSrc(props.taxon.media["mediaElement"], 55, 55)}
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
        {children.length === 1 &&
          (children[0].label) && (
            <Chip
              style={{ marginLeft: 15, marginBottom: 15, marginTop: -5 }}
              size="small"
              variant="default"
              label={
                capitalize(children[0].label)
              }
            />
          )}
      </div>
    </Card>
  );
}

export default Taxon;
