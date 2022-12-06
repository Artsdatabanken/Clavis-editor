import React from "react";
import { Card, CardHeader, CardContent, Avatar, Divider } from '@mui/material';
import HelpIcon from "@mui/icons-material/Help";

import Alternative from "./Alternative";

function Character(props) {
  return (
    <Card style={{ marginBottom: 15 }}>
      <CardHeader
        title={
          <div
            style={{
              display: "flex",
              cursor:
                props.character.media ||
                props.character.description ||
                props.character.descriptionUrl ||
                props.character.descriptionDetails
                  ? "pointer"
                  : "default",
            }}
          >
            {props.character.media_small && (
              <Avatar
                variant="square"
                src={props.character.media_small.url}
                style={{
                  flex: "0 0 50px",
                  height: "50px",
                  marginRight: "15px",
                }}
              />
            )}

            {!props.character.media_small &&
              (props.character.description ||
                props.character.descriptionUrl ||
                props.character.descriptionDetails) && (
                <HelpIcon style={{ marginRight: ".5em" }} />
              )}

            {props.character.title.nb || props.character.title.nn || props.character.title.en}
          </div>
        }
        onClick={
          (props.character.media ||
            props.character.description ||
            props.character.descriptionUrl ||
            props.character.descriptionDetails) &&
          props.setModal.bind(this, {character: props.character})
        }
      ></CardHeader>
      <CardContent>
        {props.character.states.map((state) => (
          <React.Fragment key={state.id}>
            <Divider style={{ margin: "10px 0 10px 0"}} />
            <Alternative
              alternative={state}
              siblings={props.character.states.filter(a => a.answerIs === undefined).length - 1}
              setModal={props.setModal}
              giveAnswer={props.giveAnswer}
              undoAnswer={props.undoAnswer}
              media={props.media}
            />
          </React.Fragment>
        ))}
      </CardContent>
    </Card>
  );
}

export default Character;
