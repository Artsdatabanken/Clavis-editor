import React from "react";

import { Button, Box, ButtonGroup, Avatar, Hidden } from '@mui/material';

import ClearIcon from "@mui/icons-material/Clear";
import CheckIcon from '@mui/icons-material/Check';
import RestoreIcon from "@mui/icons-material/Restore";

import { getImgSrc } from "../utils/helpers";

function getMedia(props) {
  if (props.alternative.media) {
    return (
      <Avatar
        variant="square"
        src={getImgSrc(props.alternative.media["mediaElement"], 128, 128)}
        style={{ flex: "0 0 128px", height: "128px" }}
      />
    );
  }
  return null;
}

function AlternativeContent(props) {
  const { title, media } = props.alternative;

  return (
    <div
      style={{
        display: "flex",
        flex: "1 1 auto",
        cursor:
          media ||
            props.alternative.description ||
            props.alternative.descriptionUrl ||
            props.alternative.descriptionDetails
            ? "pointer"
            : "default",
      }}
      onClick={
        (media ||
          props.alternative.description ||
          props.alternative.descriptionUrl ||
          props.alternative.descriptionDetails) &&
        props.setModal.bind(this, { alternative: props.alternative })
      }
    >
      {getMedia(props)}
      <div
        style={{
          padding: "15px",
          flex: "1 1 auto",
          flexWrap: "wrap",
        }}
      >
        {media ? <Hidden xsDown>{title.nb || title.nn || title.en}</Hidden> : <div>{title.nb || title.nn || title.en} </div>}
      </div>
    </div>
  );
}

function Alternative(props) {
  const alternative = props.alternative;
  const { id, answerIs, isAnswered } = alternative;

  const getButtons = () => {
    if (answerIs === undefined) {
      return (
        <ButtonGroup size="large" orientation="vertical">
          <Button
            className="button--green"
            onClick={props.giveAnswer.bind(this, id, true)}
          >
            <CheckIcon />
          </Button>
          {props.siblings !== 1 ? (
            <Button
              className="button--red"
              onClick={props.giveAnswer.bind(this, id, false)}
            >
              <ClearIcon />
            </Button>
          ) : (
            ""
          )}
        </ButtonGroup>
      );
    } else if (isAnswered) {
      return (
        <ButtonGroup size="large" orientation="vertical">
          <Button
            className={answerIs ? "button--green" : "button--red"}
            variant="contained"
            onClick={props.undoAnswer.bind(this, id)}
          >
            <RestoreIcon />
          </Button>
        </ButtonGroup>
      );
    }
  };

  const getBoxStyle = () => {
    let style = {};
    if (answerIs) {
      style.backgroundColor = "#E8F5E9";
    } else if (answerIs === false) {
      style.backgroundColor = "#ffebee";
    }
    return style;
  };

  return (
    <Box style={getBoxStyle()}>
      <div style={{ display: "flex", flex: "1 1 auto" }}>
        <div style={{ flex: "1 1 auto" }}>
          <AlternativeContent
            alternative={alternative}
            media={props.media}
            setModal={props.setModal}
            key={alternative.id}
          />
        </div>
        <div style={{ flex: "0 1 auto", margin: "15px" }}>{getButtons()}</div>
      </div>

      {alternative.media && (
        <Hidden smUp>
          <div
            style={{
              padding: "15px",
            }}
          >
            {alternative.title.nb}
          </div>
        </Hidden>
      )}
    </Box>
  );
}

export default Alternative;
