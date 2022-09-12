import React from "react";

import "../App.css";

const ItemMetadata = (props) => {
  const { item, setModal } = props;

  const getLicense = (url, width = 95) => {
    if (url.includes("creativecommons.org/publicdomain/zero/")) {
      url = (
        <img
          style={{ width, cursor: "pointer" }}
          alt="Licensed CC0"
          src="https://mirrors.creativecommons.org/presskit/buttons/88x31/png/cc-zero.png"
          onClick={setModal.bind(this, { url })}
        />
      );
    } else if (url.includes("creativecommons.org/licenses/by-sa/")) {
      url = (
        <img
          style={{ width, cursor: "pointer" }}
          alt="CC BY-SA"
          src="https://mirrors.creativecommons.org/presskit/buttons/88x31/png/by-sa.png"
          onClick={setModal.bind(this, { url })}
        />
      );
    } else if (url.includes("creativecommons.org/licenses/by/")) {
      url = (
        <img
          style={{ width, cursor: "pointer" }}
          alt="CC BY-SA"
          src="https://mirrors.creativecommons.org/presskit/buttons/88x31/png/by.png"
          onClick={setModal.bind(this, { url })}
        />
      );
    } else if (url.includes("creativecommons.org/")) {
      url = (
        <img
          style={{ width, cursor: "pointer" }}
          alt="CC licensed"
          src="https://mirrors.creativecommons.org/presskit/cc.primary.srr.gif"
          onClick={setModal.bind(this, { url })}
        />
      );
    } else {
      url = <a href={url}>{url}</a>;
    }
    return url;
  };

  return (
    <table className="metadataTable">
      {item.creators && (
        <tr>
          <td>Opphav:</td>
          <td>
            {item.creators.map((creator) => (
              <div
                onClick={
                  creator.url && setModal.bind(this, { url: creator.url })
                }
                style={{
                  cursor: creator.url ? "pointer" : "default",
                }}
                key={creator.id}
              >
                {creator.name}
              </div>
            ))}
          </td>
        </tr>
      )}

      {item.contributors && (
        <tr>
          <td>Bidrag:</td>
          <td>
            {item.contributors.map((contributor) => (
              <div
                onClick={
                  contributor.url &&
                  setModal.bind(this, { url: contributor.url })
                }
                style={{
                  cursor: contributor.url ? "pointer" : "default",
                }}
                key={contributor.id}
              >
                {contributor.name}
              </div>
            ))}
          </td>
        </tr>
      )}

      {item.publishers && (
        <tr>
          <td>Utgiver:</td>
          <td>
            {item.publishers.map((publisher) => (
              <div
                onClick={
                  publisher.url && setModal.bind(this, { url: publisher.url })
                }
                style={{
                  cursor: publisher.url ? "pointer" : "default",
                }}
                key={publisher.id}
              >
                {publisher.media ? (
                  <img
                    alt={publisher.name}
                    src={publisher.media.mediaElement.url}
                    style={{ maxHeight: "25px", maxWidth: "200px" }}
                  />
                ) : (
                  <span>{publisher.name}</span>
                )}
              </div>
            ))}
          </td>
        </tr>
      )}

      {item.infoUrl && (
        <tr>
          <td></td>
          <td>
            <div
              onClick={setModal.bind(this, { url: item.infoUrl })}
              style={{
                cursor: "pointer",
                color: "blue",
                textDecoration: "underline",
              }}
            >
              Mer om bildet
            </div>
          </td>
        </tr>
      )}

      {item.license && (
        <tr>
          <td></td>
          <td>{getLicense(item.license, 60)}</td>
        </tr>
      )}

      {item.version && (
        <tr>
          <td>Versjon:</td>
          <td>{item.version}</td>
        </tr>
      )}

      {item.id && !item.infoUrl && (
        <tr>
          <td>Id:</td>
          <td>{item.id}</td>
        </tr>
      )}

      {item.language && (
        <tr>
          <td>Språk:</td>
          <td>{item.language}</td>
        </tr>
      )}
    </table>
  );
};

export default ItemMetadata;
