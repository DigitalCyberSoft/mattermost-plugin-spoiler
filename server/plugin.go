package main

import (
	"fmt"
	"strings"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/plugin"
)

type SpoilerPlugin struct {
	plugin.MattermostPlugin
}

func (p *SpoilerPlugin) OnActivate() error {
	return p.API.RegisterCommand(&model.Command{
		Trigger:          "spoiler",
		AutoComplete:     true,
		AutoCompleteHint: "[message]",
		AutoCompleteDesc: "Post a message with spoiler tags (hidden until clicked)",
	})
}

func (p *SpoilerPlugin) ExecuteCommand(c *plugin.Context, args *model.CommandArgs) (*model.CommandResponse, *model.AppError) {
	text := strings.TrimSpace(strings.TrimPrefix(args.Command, "/spoiler"))
	if text == "" {
		return &model.CommandResponse{
			ResponseType: model.CommandResponseTypeEphemeral,
			Text:         "Usage: `/spoiler [message]` — wraps your message in spoiler tags.",
		}, nil
	}

	post := &model.Post{
		UserId:    args.UserId,
		ChannelId: args.ChannelId,
		RootId:    args.RootId,
		Message:   fmt.Sprintf("||%s||", text),
	}

	if _, err := p.API.CreatePost(post); err != nil {
		return nil, err
	}

	return &model.CommandResponse{}, nil
}
