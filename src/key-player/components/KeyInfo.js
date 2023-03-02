import React from "react";

import { Button, Card, CardContent, CardMedia, Typography } from '@mui/material';


function KeyInfo(props) {
  let key = props.keyItem;
  let language = props.language;

  function KeyContext() {
    if (props.subject) {
      return (
        <Typography variant="overline" display="block">
          Bestemmelsesnøkkel for {props.subject.ScientificName}
        </Typography>
      );
    } else if (props.lowerTaxon) {
      return (
        <Typography variant="overline" display="block">
          Bestemmelsesnøkkel for{" "}
          {key.classification[key.classification.length - 1].ScientificName},
          som omfatter {props.lowerTaxon.ScientificName}
        </Typography>
      );
    } else if (props.higherTaxon) {
      return (
        <Typography variant="overline" display="block">
          Bestemmelsesnøkkel for{" "}
          {key.classification[key.classification.length - 1].ScientificName},
          som faller under {props.higherTaxon.ScientificName}
        </Typography>
      );
    } else if (props.result) {
      return (
        <Typography variant="overline" display="block">
          Bestemmelsesnøkkel for{" "}
          {key.classification[key.classification.length - 1].ScientificName}, og
          har {props.result.ScientificName} som mulig utfall
        </Typography>
      );
    }

    return null;
  }

  function KeyCard() {
    return (
      <Card style={{ marginBottom: 25 }}>
        <CardContent>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ flex: "1 1 auto" }}>
              <Typography gutterBottom variant="h5" component="h2">
                {key.title[language]}
              </Typography>
              <Typography variant="body2" component="p">
                {key.description[language]}
              </Typography>

              {props.lowerTaxon && (
                <span>
                  <Button
                    className="button--orange"
                    size="small"
                    href={"?key=" + key.id}
                  >
                    Bruk hele nøkkelen
                  </Button>{" "}
                  <Button
                    className="button--orange"
                    size="small"
                    href={
                      "?key=" +
                      key.id +
                      "&taxa=" +
                      props.lowerTaxon.ScientificNameId
                    }
                  >
                    Bruk kun for {props.lowerTaxon.ScientificName}
                  </Button>
                </span>
              )}
            </div>

            {key.mediaElement && (
              <CardMedia
                component="img"
                alt={key.title[language]}
                height="140"
                image={key.mediaElement.find((m) => m.height >= 150).url}
                title={key.title[language]}
                style={{ width: 150, height: 150, flex: "0 0 auto" }}
              />
            )}
          </div>
          <Typography color="textSecondary" variant="caption" display="block">
            Bestemmelsesnøkkel for{" "}
            {key.classification[key.classification.length - 1].ScientificName}{" "}
            av {key.creators[0]}
            {key.creators.slice(1).map((c, i) => (
              <span key={i}>, {c}</span>
            ))}
            . Utgitt av {key.publishers[0]}
            {key.publishers.slice(1).map((pub, i) => (
              <span key={i}>, {pub}</span>
            ))}
            .
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <KeyContext />
      {props.lowerTaxon ? (
        <KeyCard />
      ) : (
        <a href={"?key=" + key.id} style={{ textDecoration: "none" }}>
          <KeyCard />
        </a>
      )}
    </div>
  );
}

export default KeyInfo;
