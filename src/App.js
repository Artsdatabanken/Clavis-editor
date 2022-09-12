import './Normalize.css';
import './App.css';
import * as React from "react";
import { useState } from 'react';

import {
  HashRouter,
  Routes,
  Route,
} from "react-router-dom";

import MenuBar from './components/MenuBar';
import Home from './components/Home';
import Files from './components/Files'
import Taxa from './components/Taxa';
import Characters from './components/Characters';
import Statements from './components/Statements';

import Resources from './components/Resources';
import JsonView from './components/JsonView';
import TestView from './components/TestView';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { deepClone } from './Utils';

function App() {
  const [clavis, setClavis] = useState({
    "$schema": "https://raw.githubusercontent.com/WouterKoch/Clavis/main/Schema/Clavis.json",
    "identifier": uuidv4(),
    "lastModified": moment().format('YYYY-MM-DD HH:mm:ss'),
    "language": [],
    "title": {},
    "externalServices": [
      {
        "id": "service:nbic_taxa",
        "title": "NBIC taxonomy scientificNameId",
        "description": "To retrieve taxon information based on the NBIC scientificNameId, e.g. through https://www.artsdatabanken.no/api/Taxon/ByScientificNameId/4362",
        "provider": "Norwegian Biodiversity Information Centre",
        "url": "https://www.artsdatabanken.no/help"
      },
      {
        "id": "service:nbic_page",
        "title": "NBIC page ID",
        "description": "To retrieve a page from NBIC by its ID, e.g. through https://www.artsdatabanken.no/Pages/237010",
        "provider": "Norwegian Biodiversity Information Centre",
        "url": "https://www.artsdatabanken.no/help"
      },
      {
        "id": "service:nbic_media",
        "title": "NBIC media ID",
        "description": "To retrieve a picture from NBIC by its ID, e.g. through https://www.artsdatabanken.no/Media/F27858?mode=750x750",
        "provider": "Norwegian Biodiversity Information Centre",
        "url": "https://www.artsdatabanken.no/help"
      },
    ],
    "taxa": [],
    "characters": [],
    "statements": [],
    "persons": [],
    "mediaElements": []
  })

  const newImage = (imgId) => {
    let c = { ...clavis }
    let mediaElements = c["mediaElements"];
    let id

    if(!imgId) {
      return imgId
    }

    if (imgId.includes("/")) {
      if (!mediaElements.some(element => element["mediaElement"]["file"]["url"] === imgId)) {
        id = "media:" + uuidv4().replaceAll("-", "")
        mediaElements.push(
          {
            "id": id,
            "mediaElement": {
              "file": {
                "url": imgId
              }
            }
          }
        )
      }
      else {
        id = mediaElements.find(element => element["mediaElement"]["file"]["url"] === imgId).id
      }
    }
    else {
      id = ("media:" + imgId).toLowerCase()
      if (!mediaElements.some(element => element["mediaElement"]["file"]["url"]["externalId"] === imgId)) {
        mediaElements.push(
          {
            "id": id,
            "mediaElement": {
              "file": {
                "url": {
                  "serviceId": "service:nbic_media",
                  "externalId": imgId
                }
              }
            }
          }
        )
      }
    }
    c["mediaElements"] = mediaElements

    setClavis(c)
    return id
  }

  const newPerson = () => {
    let c = { ...clavis }
    const personId = "person:" + uuidv4().replaceAll("-", "")
    c["persons"].push({
      "id": personId,
      "name": {}
    })

    setClavis(c)
    return personId
  }

  const plurals = (item) => {
    if (item === "taxon") {
      return "taxa"
    }
    return item + "s"
  }

  const replaceItem = (item, type) => {

    let c = { ...clavis }
    if ("$schema" in item) {
      c = deepClone(item)
      setClavis(c)
    }
    else if (type) {
      c[type] = item
      setClavis(c)
      return item
    }
    else if (Array.isArray(item)) {
      if (item.length > 0) {
        let itemType = item[0]["id"].split(":")[0]
        c[plurals(itemType)] = item
      }
      setClavis(c)
      return item
    }
    else if (item["id"].split(":")[0] === "state") {
      // For some reason find() and includes() does not work here...
      let character
      deepClone(c.characters).forEach(char => {
        char.states.forEach(s => {
          if (s.id === item.id) {
            character = char
          }
        })
      })

      character.states = character.states.map(s => {
        if (item.id === s.id) {
          return item
        }
        return s
      })
      return replaceItem(character)
    }
    else {
      let itemType = item["id"].split(":")[0]
      let items = deepClone(c[plurals(itemType)])

      items = items.map(i => {
        return (i["id"] === item["id"] ? item : i)
      })
      c[plurals(itemType)] = items
      setClavis(c)
      return items
    }
  }

  const deleteItem = (item, items) => {
    let c = { ...clavis }
    let itemType = item["id"].split(":")[0]

    if (itemType === "state") {
      let character = deepClone(c.characters.find(char =>
        !!char.states.find(state => state.id === item.id)
      ))
      character.states = character.states.filter(s =>
        item.id !== s.id)


      console.log(character)
      return character
    }
    else if(itemType === "taxon") {
      if(!items) {
        items = deepClone(c.taxa)
      }
      items = items.filter(x => x.id !== item.id)
      items = items.map(x =>{
        if(!!x.children) {
          x.children = deleteItem(item, x.children)
        }
        return x
      })
      return items
    }
    else {
      return deepClone(c[plurals(itemType)]).filter(i =>
        i["id"] !== item["id"]
      )
    }
  }


  return (
    <HashRouter>
      <div className='page'>
        <MenuBar />
        <div className='content-section' id="content">
          <Routes>
            <Route path="/" element={<Home clavis={clavis} replaceItem={replaceItem} newPerson={newPerson} newImage={newImage} />} />
            <Route path="/files" element={<Files clavis={clavis} setClavis={setClavis} />} />
            <Route path="/taxa" element={<Taxa taxa={clavis["taxa"]} languages={clavis["language"]} mediaElements={clavis["mediaElements"]} newImage={newImage} replaceItem={replaceItem}  deleteItem={deleteItem} />} />
            <Route path="/characters" element={<Characters characters={clavis["characters"]} languages={clavis["language"]} mediaElements={clavis["mediaElements"]} newImage={newImage} replaceItem={replaceItem} deleteItem={deleteItem} />} />
            <Route path="/statements" element={<Statements statements={clavis["statements"]} characters={clavis["characters"]} taxa={clavis["taxa"]} languages={clavis["language"]} replaceItem={replaceItem} deleteItem={deleteItem}  />} />
            <Route path="/resources" element={<Resources clavis={clavis} />} />
            <Route path="/json" element={<JsonView clavis={clavis} />} />
            <Route path="/test" element={<TestView clavis={clavis} />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}

export default App;
