import React, { Component } from "react";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";

// https://artsdatabanken.no/Api/Taxon/ScientificName?ScientificName={props.prediction.taxon.name}
// get taxonID
// https://artsdatabanken.no/Api/Taxon/{taxonID}
// get PreferredVernacularName.vernacularName

const getDonut = (percentage) => {
  const strokes = percentage.toString() + " " + (100 - percentage).toString();
  let color;

  if (percentage > 80) {
    color = "#4caf50";
  } else if (percentage > 50) {
    color = "#ff9800";
  } else {
    color = "#dc004e";
  }

  return (
    <svg width="100%" height="100%" viewBox="0 0 42 42" className="donut">
      <circle
        className="donut-hole"
        cx="21"
        cy="21"
        r="15.91549430918954"
        fill="#fff"
      ></circle>
      <circle
        className="donut-ring"
        cx="21"
        cy="21"
        r="15.91549430918954"
        fill="transparent"
        stroke="#d2d3d4"
        strokeWidth="8"
      ></circle>

      <circle
        className="donut-segment"
        cx="21"
        cy="21"
        r="15.91549430918954"
        fill="transparent"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={strokes}
        strokeDashoffset="0"
      ></circle>
    </svg>
  );
};

class IdResult extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    if (!this.state.vernacularName) {
      fetch(
        "https://artsdatabanken.no/Api/Taxon/ScientificName?ScientificName=" +
          this.props.prediction.taxon.name,
        null
      )
        .then((response) => response.json())
        .then((result) => {
          fetch(
            "https://artsdatabanken.no/Api/Taxon/" + result[0].taxonID,
            null
          )
            .then((response) => response.json())
            .then((nameResult) => {
              if (nameResult.PreferredVernacularName) {
                this.setState({
                  vernacularName:
                    nameResult.PreferredVernacularName.vernacularName
                      .charAt(0)
                      .toUpperCase() +
                    nameResult.PreferredVernacularName.vernacularName.substring(
                      1
                    ),
                });
              }
            });
        })
        .catch((error) => console.log("error", error));
    }
    return (
      <TableRow>
        <TableCell style={{ width: "5em" }}>
          {getDonut((this.props.prediction.probability * 100).toFixed(1))}
        </TableCell>
        <TableCell>
          <h1 style={{ margin: 0 }}>{this.state.vernacularName}</h1>{" "}
          <i>{this.props.prediction.taxon.name}</i>
          <br />{" "}
          <small>
            ({(this.props.prediction.probability * 1000).toFixed(0) / 10}%
            sikkerhet)
          </small>
        </TableCell>
      </TableRow>
    );
  }
}

export default IdResult;
