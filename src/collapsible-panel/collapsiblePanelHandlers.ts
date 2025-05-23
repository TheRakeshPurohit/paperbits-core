﻿import { IWidgetOrder, IWidgetHandler, WidgetContext } from "@paperbits/common/editing";
import { CollapsiblePanelModel } from "./collapsiblePanelModel";
import { IContextCommandSet, ViewManager } from "@paperbits/common/ui";
import { WidgetModel } from "@paperbits/common/widgets";
import { EventManager, Events } from "@paperbits/common/events";
import { DragSession } from "@paperbits/common/ui/draggables";


export class CollapsiblePanelHandlers implements IWidgetHandler<CollapsiblePanelModel> {
    constructor(
        private readonly viewManager: ViewManager,
        private readonly eventManager: EventManager
    ) { }

    public canAccept(dragSession: DragSession): boolean {
        return !["section", "row", "column", "collapsiblePanel"].includes(dragSession.sourceBinding.name);
    }

    public getContextCommands(context: WidgetContext): IContextCommandSet {
        const gridCellContextualEditor: IContextCommandSet = {
            color: "#9C27B0",
            hoverCommands: [{
                controlType: "toolbox-button",
                color: "#607d8b",
                iconClass: "paperbits-icon paperbits-simple-add",
                position: context.half,
                tooltip: "Add widget",
                component: {
                    name: "widget-selector",
                    params: {
                        onRequest: () => context.providers,
                        onSelect: (newWidgetModel: any) => {
                            let index = context.parentModel.widgets.indexOf(context.model);

                            if (context.half === "bottom") {
                                index++;
                            }

                            context.parentBinding.model.widgets.splice(index, 0, newWidgetModel);
                            context.parentBinding.applyChanges();

                            this.viewManager.clearContextualCommands();
                        }
                    }
                }
            }],
            deleteCommand: {
                controlType: "toolbox-button",
                tooltip: "Delete widget",
                color: "#607d8b",
                callback: () => {
                    context.parentModel.widgets.remove(context.model);
                    context.parentBinding.applyChanges();
                    this.viewManager.clearContextualCommands();
                },
            }
        };

        if (context.model.widgets.length === 0) {
            gridCellContextualEditor.hoverCommands.push({
                controlType: "toolbox-button",
                color: "#607d8b",
                iconClass: "paperbits-icon paperbits-simple-add",
                position: "center",
                tooltip: "Add widget",
                component: {
                    name: "widget-selector",
                    params: {
                        onRequest: () => context.providers,
                        onSelect: (widget: WidgetModel) => {
                            context.model.widgets.push(widget);
                            context.binding.applyChanges();
                            this.eventManager.dispatchEvent(Events.ContentUpdate);
                            this.viewManager.clearContextualCommands();
                        }
                    }
                }
            });
        }

        return gridCellContextualEditor;
    }
}