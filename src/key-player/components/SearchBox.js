import React, { Component } from "react";
import Autosuggest from "react-autosuggest";

import "../App.css";

function renderSuggestion(suggestion) {
  let vernacularName;

  if (suggestion.PopularName) {
    vernacularName =
      suggestion.PopularName.charAt(0).toUpperCase() +
      suggestion.PopularName.slice(1).toLowerCase();
  }

  if (suggestion.ScientificName.includes(" ")) {
    return (
      <span className=".react-autosuggest__suggestion">
        {vernacularName} {vernacularName && "("}
        <i>{suggestion.ScientificName}</i>
        {vernacularName && ")"}
      </span>
    );
  }

  return (
    <span className=".react-autosuggest__suggestion">
      {vernacularName} {vernacularName && "("}
      {suggestion.ScientificName}
      {vernacularName && ")"}
    </span>
  );
}

class SearchBox extends Component {
  constructor(props) {
    super();

    this.state = {
      value: "",
      suggestions: [],
    };
  }

  onChange = (event, { newValue, method }) => {
    this.setState({
      value: newValue,
    });

    if (newValue.trim() === "") {
      this.props.applyFilter(null);
    }
  };

  getSuggestionValue = (suggestion) => {
    this.props.applyFilter(suggestion);
    return suggestion.ScientificName;
  };

  onSuggestionsFetchRequested = ({ value }) => {
    fetch(
      "https://artskart.artsdatabanken.no/appapi/api/data/SearchTaxons?maxCount=10&name=" +
        value
    )
      .then((response) => response.json())
      .then((data) => {
        this.setState({
          suggestions: data.filter((d) =>
            [1, 3, 6, 11, 12, 13, 14, 15, 16, 19, 22, 23].includes(
              d.TaxonCategory
            )
          ),
        });
      });
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: [],
    });
  };

  render() {
    const { value, suggestions } = this.state;
    const inputProps = {
      placeholder: "Søk på takson",
      value,
      onChange: this.onChange,
    };

    return (
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={this.getSuggestionValue}
        renderSuggestion={renderSuggestion}
        inputProps={inputProps}
      />
    );
  }
}

export default SearchBox;
