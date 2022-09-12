import React, { Component } from "react";

import Identification from "./components/Identification";
import KeyList from "./components/KeyList";

import "./App.css";

class App extends Component {
  constructor() {
    super();
    this.state = {
      keys: [],
      tree: []
    };
  }

  componentDidMount() {
    fetch("https://keys.test.artsdatabanken.no/keys.json")
      .then((response) => response.json())
      .then((data) => {
        this.setState({ keys: data.keys, tree: data.tree });
      });
  }

  render() {
    const urlParams = new URLSearchParams(window.location.search);
    const keyId = urlParams.get("key");

    let taxonSelection = urlParams.get("taxa") ? urlParams.get("taxa").split(',') : [];


    if (keyId && this.state.keys.find((k) => k.id === keyId)) {
      return <Identification keyId={keyId} keys={this.state.keys} taxonSelection={taxonSelection} />;
    }
    return <KeyList keys={this.state.keys} tree={this.state.tree}/>;
  }
}

export default App;
