import { Keys } from "@paperbits/common";
import * as Arrays from "@paperbits/common/arrays";
import { AriaAttributes } from "@paperbits/common/html";

const toggleAtributeName = "data-toggle";
const targetAttributeName = "data-target";
const dismissAttributeName = "data-dismiss";
const showClassName = "show";
const popupContainerClass = ".popup-container";
const onPopupRepositionRequestedEvent = "onPopupRepositionRequested";
const onPopupRequestedEvent = "onPopupRequested";


const onActivate = (toggleElement: HTMLElement, toggleType: string): void => {
    switch (toggleType) {
        case "popup":
            const targetSelector = toggleElement.getAttribute(targetAttributeName);

            if (!targetSelector) {
                return;
            }

            const targetElement = <HTMLElement>document.querySelector(targetSelector);

            if (!targetElement) {
                return;
            }

            onShowPopup(toggleElement, targetElement);
            break;

        case "dropdown": {
            const targetElement = <HTMLElement>toggleElement.parentElement.querySelector(".dropdown");
            onShowTogglable(toggleElement, targetElement);
            break;
        }

        case "collapsible": {
            const targetElement = <HTMLElement>toggleElement.closest(".collapsible-panel");
            onShowTogglable(toggleElement, targetElement);
            break;
        }
        default:
            console.warn(`Unknown data-toggle value ${toggleType}`);
    }
};


const onClick = (event: MouseEvent): void => {
    if (event.button !== 0) {
        return;
    }

    const clickedElement = <HTMLElement>event.target;
    const toggleElement = <HTMLElement>clickedElement.closest(`[${toggleAtributeName}]`);

    if (!toggleElement) {
        return;
    }

    event.preventDefault();

    const toggleType = toggleElement.getAttribute(toggleAtributeName);
    onActivate(toggleElement, toggleType);
};

const onMouseEnter = (event: MouseEvent): void => {
    const clickedElement = <HTMLElement>event.target;
    const toggleElement = <HTMLElement>clickedElement.closest(`[${toggleAtributeName}]`);

    if (!toggleElement) {
        return;
    }

    event.preventDefault();

    const toggleType = toggleElement.getAttribute(toggleAtributeName);
    onActivate(toggleElement, toggleType);

    console.log(toggleElement);
};

const onKeyDown = (event: KeyboardEvent) => {
    if (event.keyCode !== Keys.Enter && event.keyCode !== Keys.Space) {
        return;
    }
};

const onShowTogglable = (toggleElement: HTMLElement, targetElement: HTMLElement): void => {
    if (!toggleElement || !targetElement) {
        return;
    }

    const dismissElement = targetElement.querySelector(`[${dismissAttributeName}]`);

    const openTarget = (): void => {
        targetElement.classList.add(showClassName);
        toggleElement.setAttribute(AriaAttributes.expanded, "true");

        setImmediate(() => addEventListener("mousedown", clickOutside));

        if (dismissElement) {
            dismissElement.addEventListener("mousedown", closeTarget);
        }
    };

    const closeTarget = (): void => {
        targetElement.classList.remove(showClassName);
        removeEventListener("mousedown", clickOutside);
        toggleElement.setAttribute(AriaAttributes.expanded, "false");

        if (dismissElement) {
            dismissElement.removeEventListener("mousedown", clickOutside);
        }
    };

    const clickOutside = (event: MouseEvent) => {
        const clickTarget = <HTMLElement>event.target;

        if (clickTarget.nodeName === "BODY") {
            return;
        }

        const isTargetClicked = targetElement.contains(clickTarget);

        if (isTargetClicked) {
            return;
        }

        closeTarget();
    };

    if (!targetElement.classList.contains(showClassName)) {
        openTarget();
    }
};

const onShowPopup = (toggleElement: HTMLElement, targetElement: HTMLElement): void => {
    if (!toggleElement || !targetElement) {
        return;
    }

    const popupContainerElement: HTMLElement = targetElement.querySelector(popupContainerClass);

    const repositionPopup = (event?: CustomEvent): void => {
        const computedStyles = getComputedStyle(popupContainerElement);

        if (computedStyles.position === "absolute") {
            const actualToggleElement: HTMLElement = event?.detail?.element || toggleElement;
            const toggleElementRect = actualToggleElement.getBoundingClientRect();
            const popupContainerElement: HTMLElement = targetElement.querySelector(popupContainerClass);
            const popupContainerElementRect = popupContainerElement.getBoundingClientRect();
            const requestedPosition = actualToggleElement.getAttribute("data-position") || "bottom";

            const triggerHalfWidth = Math.floor(toggleElementRect.width / 2);
            const triggerHalfHeight = Math.floor(toggleElementRect.height / 2);
            const popupHalfWidth = Math.floor(popupContainerElementRect.width / 2);
            const popupHalfHeight = Math.floor(popupContainerElementRect.height / 2);

            const position = requestedPosition.split(" ");

            // Default assignments
            popupContainerElement.style.left = toggleElementRect.left + triggerHalfWidth - popupHalfWidth + "px";
            popupContainerElement.style.top = window.scrollY + toggleElementRect.top + triggerHalfHeight - popupHalfHeight + "px";

            if (position.includes("top")) {
                popupContainerElement.style.top = window.scrollY + toggleElementRect.top - popupContainerElementRect.height - triggerHalfHeight + "px";
            }

            if (position.includes("bottom")) {
                popupContainerElement.style.top = window.scrollY + toggleElementRect.bottom + "px";
            }

            if (position.includes("left")) {
                popupContainerElement.style.left = toggleElementRect.left + "px";
            }

            if (position.includes("right")) {
                popupContainerElement.style.left = toggleElementRect.right - popupContainerElementRect.width + "px";
            }

            return;
        }

        popupContainerElement.removeAttribute("style");
    };

    const dismissElements: HTMLElement[] = Arrays.coerce(targetElement.querySelectorAll(`[${dismissAttributeName}]`));

    const clickOutside = (event: MouseEvent) => {
        const clickTarget = <HTMLElement>event.target;

        if (clickTarget.nodeName === "BODY") {
            return;
        }

        const isTargetClicked = popupContainerElement.contains(clickTarget);

        if (isTargetClicked) {
            return;
        }

        closeTarget(event);
    };

    const closeTarget = (event: Event): void => {
        event.preventDefault();
        event.stopImmediatePropagation();

        for (const dismissElement of dismissElements) {
            dismissElement.removeEventListener("mousedown", closeTarget);
        }

        targetElement.ownerDocument.removeEventListener("mousedown", clickOutside);
        targetElement.classList.remove(showClassName);
        toggleElement.setAttribute(AriaAttributes.expanded, "false");

        // Temporary hack to reposition popup:
        document.removeEventListener(onPopupRepositionRequestedEvent, repositionPopup);
    };

    const openTarget = (): void => {
        for (const dismissElement of dismissElements) {
            dismissElement.addEventListener("mousedown", closeTarget);
        }

        targetElement.classList.add(showClassName);
        toggleElement.setAttribute(AriaAttributes.expanded, "true");

        setImmediate(() => {
            targetElement.ownerDocument.addEventListener("mousedown", clickOutside);
            repositionPopup();
        });

        // Temporary hack to reposition popup:
        document.addEventListener(onPopupRepositionRequestedEvent, repositionPopup);
    };

    if (!targetElement.classList.contains(showClassName)) {
        openTarget();
    }
};

const onPopupRequest = (event: CustomEvent): void => {
    const popupKey = event.detail;
    const targetSelector = `#${popupKey.replace("popups/", "popups")}`;
    const targetElement = <HTMLElement>document.querySelector(targetSelector);
    const triggerSelector = `[data-target="${targetSelector}"]`;
    const triggerElement = <HTMLElement>document.querySelector(triggerSelector);

    if (targetElement.classList.contains(showClassName)) {
        return;
    }

    const openTargetElement = document.querySelector(`.${showClassName}`);

    if (openTargetElement) {
        openTargetElement.classList.remove(showClassName);
    }

    onShowPopup(triggerElement, targetElement);
};

// addEventListener("mousedown", onClick, true);
// addEventListener("keydown", onKeyDown, true);
document.addEventListener(onPopupRequestedEvent, onPopupRequest);





// const toggles = Arrays.coerce<HTMLElement>(document.querySelectorAll(`[${toggleAtributeName}]`));

// toggles.forEach(toggle => {
//     toggle.addEventListener("mousedown", onClick, true);
//     toggle.addEventListener("keydown", onKeyDown, true);
// });

const selector = `[${toggleAtributeName}]`;

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        const target = <HTMLElement>mutation.target;

        if (mutation.type === "attributes" && mutation.attributeName === toggleAtributeName) {
            const newValue = target.getAttribute(mutation.attributeName);

            if (newValue === null) {
                target.removeEventListener("mousedown", onClick);
                target.removeEventListener("keydown", onKeyDown);
                target.removeEventListener("mouseleave", onMouseEnter);
            }
            return;
        }

        mutation.addedNodes.forEach((addedNode: HTMLElement) => {
            if (!addedNode.matches || !addedNode.matches(selector)) {
                return;
            }



            // addedNode.addEventListener("mousedown", onClick);
            // addedNode.addEventListener("keydown", onKeyDown);
            addedNode.addEventListener("mouseenter", onMouseEnter);
            // addedNode.addEventListener("mouseleave", onMouseLeave);
        });

        mutation.removedNodes.forEach((addedNode: HTMLElement) => {
            if (!addedNode.matches || !addedNode.matches(selector)) {
                return;
            }

            // addedNode.removeEventListener("mousedown", onClick);
            // addedNode.removeEventListener("keydown", onKeyDown);
            addedNode.removeEventListener("mouseenter", onMouseEnter);
        });
    });
});

observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true });