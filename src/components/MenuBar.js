import React from "react";
import { useNavigate } from "react-router-dom";

import {
  MenuList,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Drawer,
  CardContent,
} from "@mui/material";
import CloudSyncIcon from "@mui/icons-material/CloudSync";
import InfoIcon from "@mui/icons-material/Info";
import LanguageIcon from "@mui/icons-material/Language";
import ForestIcon from "@mui/icons-material/Forest";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import BackupTableIcon from "@mui/icons-material/BackupTable";
// import CollectionsIcon from '@mui/icons-material/Collections';
// import SwitchAccountIcon from '@mui/icons-material/SwitchAccount';
import QuizIcon from "@mui/icons-material/Quiz";
import DataObjectIcon from "@mui/icons-material/DataObject";
import TroubleshootIcon from "@mui/icons-material/Troubleshoot";
import YardIcon from "@mui/icons-material/Yard";
import FilterAltIcon  from "@mui/icons-material/FilterAlt";


import { ReactComponent as Logo } from "./Logo.svg";
import CircularProgress from "@mui/material/CircularProgress";

function MenuBar({ loadingPage, setLoadingPage }) {
  const navigate = useNavigate();

  return (
    <Drawer variant="permanent" anchor="left" className="menu-section">
      <CardContent
        style={{
          backgroundColor: "#455a64",
          fontSize: "1.6em",
          fontWeight: 300,
          color: "white",
        }}
      >
        <Logo style={{ height: "96px", width: "inherit" }} />
      </CardContent>
      <MenuList>
        <MenuItem icon="cloud" onClick={() => navigate("/files")}>
          <ListItemIcon>
            <CloudSyncIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Load/Save</ListItemText>
        </MenuItem>
        <Divider title="Key content" />
        <MenuItem onClick={() => navigate("/")}>
          <ListItemIcon>
            <InfoIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>General information</ListItemText>
        </MenuItem>
        <MenuItem text="Taxa" onClick={() => navigate("/taxa")}>
          <ListItemIcon>
            <ForestIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Taxa</ListItemText>
        </MenuItem>
        <MenuItem text="Characters" onClick={() => navigate("/characters")}>
          <ListItemIcon>
            <PlaylistAddCheckIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Characters</ListItemText>
        </MenuItem>
        {/* <MenuItem text="Statements" onClick={() => navigate('/statements')} >
          <ListItemIcon>
            <RuleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Statements</ListItemText>
        </MenuItem> */}
        <MenuItem
          text="Tabular"
          onClick={() => {
            setLoadingPage("Statements");
            setTimeout(() => {
              navigate("/tabular");
            }, 10);
          }}
        >
          <ListItemIcon>
            <BackupTableIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Statements</ListItemText>
          {loadingPage === "Statements" && (
            <CircularProgress disableShrink value={75} size={20} />
          )}
        </MenuItem>
        <MenuItem text="Tabular" onClick={() => navigate("/taxonview")}>
          <ListItemIcon>
            <YardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Per taxon</ListItemText>
        </MenuItem>
        <MenuItem text="Translations" onClick={() => navigate("/translations")}>
          <ListItemIcon>
            <LanguageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Translations</ListItemText>
        </MenuItem>
        {/* <MenuItem text="Media"  >
          <ListItemIcon>
            <CollectionsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Media</ListItemText>
        </MenuItem>
        <MenuItem text="Resources" onClick={() => navigate('/resources')} >
          <ListItemIcon>
            <SwitchAccountIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Resources</ListItemText>
        </MenuItem> */}
        <Divider />


        <MenuItem
          icon="endorsed"
          text="Taxon filter"
          onClick={() => navigate("/taxonfilter")}
        >
          <ListItemIcon>
            <FilterAltIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Taxon filter</ListItemText>
        </MenuItem>


        <MenuItem
          icon="endorsed"
          text="Test the key"
          onClick={() => navigate("/test")}
        >
          <ListItemIcon>
            <QuizIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Test the key</ListItemText>
        </MenuItem>

        <MenuItem
          icon="endorsed"
          text="Analyze the key"
          onClick={() => {
            setLoadingPage("Analyze");
            setTimeout(() => {
              navigate("/analyze");
            }, 10);
          }}
        >
          <ListItemIcon>
            <TroubleshootIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Analyze</ListItemText>
          {loadingPage === "Analyze" && (
            <CircularProgress disableShrink value={75} size={20} />
          )}
        </MenuItem>

        <Divider />
        <MenuItem
          icon="code"
          text="View JSON"
          onClick={() => navigate("/json")}
        >
          <ListItemIcon>
            <DataObjectIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View JSON</ListItemText>
        </MenuItem>
        <Divider />
      </MenuList>
    </Drawer>
  );
}

export default MenuBar;
