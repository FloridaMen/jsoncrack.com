import React from "react";
import { Flex, Menu, Popover, Text } from "@mantine/core";
import styled from "styled-components";
import { event as gaEvent } from "nextjs-google-analytics";
import { BiSolidDockLeft } from "react-icons/bi";
import { IoMdCheckmark } from "react-icons/io";
import { MdArrowUpward, MdEdit } from "react-icons/md";
import { VscCheck, VscError, VscRunAll, VscSync, VscSyncIgnored } from "react-icons/vsc";
import { formats } from "../../enums/file.enum";
import useConfig from "../../store/useConfig";
import useFile from "../../store/useFile";
import useGraph from "./views/GraphView/stores/useGraph";

const StyledBottomBar = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid ${({ theme }) => theme.BACKGROUND_MODIFIER_ACCENT};
  background: ${({ theme }) => theme.TOOLBAR_BG};
  max-height: 27px;
  height: 27px;
  z-index: 35;
  padding-right: 6px;

  @media screen and (max-width: 320px) {
    display: none;
  }
`;

const StyledLeft = styled.div`
  display: flex;
  align-items: center;
  justify-content: left;
  gap: 4px;
  padding-left: 8px;

  @media screen and (max-width: 480px) {
    display: none;
  }
`;

const StyledRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: right;
  gap: 4px;
`;

const StyledBottomBarItem = styled.button<{ $bg?: string }>`
  display: flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  margin: 0;
  height: 28px;
  padding: 4px;
  font-size: 12px;
  font-weight: 400;
  color: ${({ theme }) => theme.INTERACTIVE_NORMAL};
  background: ${({ $bg }) => $bg};
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;

  &:hover:not(&:disabled) {
    background-image: linear-gradient(rgba(0, 0, 0, 0.1) 0 0);
    color: ${({ theme }) => theme.INTERACTIVE_HOVER};
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

export const BottomBar = () => {
  const data = useFile(state => state.fileData);
  const toggleLiveTransform = useConfig(state => state.toggleLiveTransform);
  const liveTransformEnabled = useConfig(state => state.liveTransformEnabled);
  const error = useFile(state => state.error);
  const setContents = useFile(state => state.setContents);
  const toggleFullscreen = useGraph(state => state.toggleFullscreen);
  const fullscreen = useGraph(state => state.fullscreen);
  const setFormat = useFile(state => state.setFormat);
  const currentFormat = useFile(state => state.format);

  // Edit mode state
  const [editMode, setEditMode] = React.useState(false);
  const [tempString, setTempString] = React.useState<string>("");
  const [editError, setEditError] = React.useState<string | null>(null);

  const toggleEditor = () => {
    toggleFullscreen(!fullscreen);
    gaEvent("toggle_fullscreen");
  };

  React.useEffect(() => {
    if (data?.name) window.document.title = `${data.name} | JSON Crack`;
  }, [data]);

  // Handler for entering edit mode
  const handleEdit = () => {
    setTempString(JSON.stringify(data?.content || {}, null, 2));
    setEditMode(true);
    setEditError(null);
  };

  // Handler for saving changes
  const handleSave = () => {
    try {
      const parsed = JSON.parse(tempString);
      setContents(parsed);
      setEditMode(false);
      setEditError(null);
    } catch (e: any) {
      setEditError("Invalid JSON: " + e.message);
    }
  };

  // Handler for canceling edit
  const handleCancel = () => {
    setTempString("");
    setEditMode(false);
    setEditError(null);
  };

  // Handler for editing JSON (free text)
  const handleTempChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTempString(e.target.value);
  };

  return (
    <>
      <StyledBottomBar>
        <StyledLeft>
          <StyledBottomBarItem onClick={toggleEditor}>
            <BiSolidDockLeft />
          </StyledBottomBarItem>
          <StyledBottomBarItem>
            {error ? (
              <Popover width="auto" shadow="md" position="top" withArrow>
                <Popover.Target>
                  <Flex align="center" gap={2}>
                    <VscError color="red" />
                    <Text c="red" fw={500} fz="xs">
                      Invalid
                    </Text>
                  </Flex>
                </Popover.Target>
                <Popover.Dropdown style={{ pointerEvents: "none" }}>
                  <Text size="xs">{error}</Text>
                </Popover.Dropdown>
              </Popover>
            ) : (
              <Flex align="center" gap={2}>
                <VscCheck />
                <Text size="xs">Valid</Text>
              </Flex>
            )}
          </StyledBottomBarItem>
          {/* Edit Button only when not editing */}
          {!editMode && (
            <StyledBottomBarItem onClick={handleEdit}>
              <MdEdit />
              <Text fz="xs">Edit</Text>
            </StyledBottomBarItem>
          )}
          <StyledBottomBarItem
            onClick={() => {
              toggleLiveTransform(!liveTransformEnabled);
              gaEvent("toggle_live_transform");
            }}
          >
            {liveTransformEnabled ? <VscSync /> : <VscSyncIgnored />}
            <Text fz="xs">Live Transform</Text>
          </StyledBottomBarItem>
          {!liveTransformEnabled && (
            <StyledBottomBarItem onClick={() => setContents({})} disabled={!!error}>
              <VscRunAll />
              Click to Transform
            </StyledBottomBarItem>
          )}
        </StyledLeft>
        <StyledRight>
          <Menu offset={8}>
            <Menu.Target>
              <StyledBottomBarItem>
                <Flex align="center" gap={2}>
                  <MdArrowUpward />
                  <Text size="xs">{currentFormat?.toUpperCase()}</Text>
                </Flex>
              </StyledBottomBarItem>
            </Menu.Target>
            <Menu.Dropdown>
              {formats.map(format => (
                <Menu.Item
                  key={format.value}
                  fz={12}
                  onClick={() => setFormat(format.value)}
                  rightSection={currentFormat === format.value && <IoMdCheckmark />}
                >
                  {format.label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        </StyledRight>
      </StyledBottomBar>

      {/* Modal overlay for editing JSON */}
      {editMode && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#222",
              padding: 24,
              borderRadius: 8,
              minWidth: 400,
              maxWidth: "80vw",
              minHeight: 200,
              boxShadow: "0 4px 32px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
            }}
          >
            <textarea
              style={{ width: "100%", height: 200, fontSize: 14, marginBottom: 16, background: "#111", color: "#fff", border: "1px solid #444", borderRadius: 4, padding: 8 }}
              value={tempString}
              onChange={handleTempChange}
              autoFocus
            />
            {editError && (
              <div style={{ color: "#ff4136", marginBottom: 8 }}>{editError}</div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={handleSave} style={{ background: "#2ecc40", color: "#fff", border: "none", borderRadius: 4, padding: "6px 16px", fontWeight: 600, cursor: "pointer" }}>
                Save
              </button>
              <button onClick={handleCancel} style={{ background: "#ff4136", color: "#fff", border: "none", borderRadius: 4, padding: "6px 16px", fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
