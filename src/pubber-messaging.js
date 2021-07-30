class pubsubMessageRouter extends HTMLElement {
    static get tagname() {
        return "PUBSUB-ROUTER";
    }

    //=========================================================
    //                       Constructor
    //=========================================================
    constructor() {
        super();

        this._message_handler = null;
        this._observer = null;
        this.registrations = {};
        this.idcount = 0;
//         window.addEventListener(
//             'DOMContentLoaded',
// 
//             function(event) {
//                 console.log("LOADED");
//                 document.body.appendChild(document.createElement("LI"));
//                 self.start();
//             }
//         );
    }

    register_consumers(root_element) {
        var messenger = this;

        try {
            var selection = (root_element || document).querySelectorAll("*");
        }
        catch (TypeError) {
            return;
        }

        var subscription_elements = Array.from(selection).filter(
            function(element) {
                return (
                    element != null && element.getAttribute("subscribe") != null
                );
            }
        );

        console.log("REGISTER CONSUMERS " + subscription_elements.length);

        subscription_elements.forEach(
            function(element) {
                console.log("Registering " + element.nodeType + " " + element.nodeName);

//                 messenger.setElementHandler(element);
//                 messenger.setElementTopics(element);
// 
//                 if (element.emit == null) {
//                     element.emit = function(topic, payload) {
//                         messenger.broadcast(topic, payload);
//                     }
//                 }
            }
        );
    }

    //=========================================================
    //                      Class Methods
    //=========================================================
    static get singleton() {
        var elements = document.getElementsByTagName(this.tagname);

        for (var i=0; i < elements.length; ++i) {
            return elements[i];
        }

        var search_elements = document.getElementsByTagName("BODY");

        for (var i=0; i < search_elements.length; ++i) {
            var parent_node = search_elements[i];
            parent_node.appendChild(element);
            return element;
        }

        throw new Error("No BODY element found in document");
    }

    //=========================================================
    //                    Object Properties
    //=========================================================
    get observer() {
        if (this._observer == null) {
            var self = this;

            // Create an observer instance linked to the callback function
            this._observer = new MutationObserver(
                function(mutationsList, observer) {
                    for (const mutation of mutationsList) {
                        if (mutation.type === 'childList') {
                            self.elementsChanged(mutation.addedNodes);
                        }
                    }
                }
            );
        }

        return this._observer;
    }

    //=========================================================
    //                    Subcriptions
    //=========================================================
    register(element, topic) {
        if (topic in {null: 0, "": 0, "null": 0}) {
            return;
        }

        if (element.id in {null: 0, "": 0}) {
            element.id = "pubsub_registration_" + this.idcount++;
        }

        var topic = topic.toLowerCase();

        if (this.registrations[topic] == null) {
            this.registrations[topic] = {};
        }

        this.registrations[topic][element.id] = 1;

//         console.log("REGISTER: topic=" + topic + " elements=" + Object.keys(this.registrations[topic]).join(",") + "]");
    }

    deregister(element, topic) {
        if (element.id in {null: 0, "": 0}) {
            return;
        }

        var topic = topic.toLowerCase();

        if (this.registrations[topic] == null) {
            return;
        }

        if (! (topic in this.registrations)) {
            return;
        }

        this.registrations[topic][element.id] == 0;
    }

    //=========================================================
    //                    Publishing
    //=========================================================
    broadcast(topic, payload) {
        var topic = topic.toLowerCase();

        var registered_elements = Object.entries(this.registrations[topic] || {}).filter(
            function(pair) {
                const [_id, _bool] = pair;
                return _bool;
            }
        ).map(
            function(pair) {
                const [_id, _bool] = pair;
                return document.getElementById(_id);
            }
        ).filter(
            function(_element) {
                return _element != null;
            }
        ).forEach(
            function(_element) {
                _element.receive(topic, payload);
            }
        );
    }

    //=========================================================
    //                  Message Handling
    //=========================================================
    emit(topic, payload) {
        this.messenger.broadcast(topic, payload);
    }

    setTopics() {
        this.messenger.setElementTopics(this);
    }

    //=========================================================
    //                    Event Handling
    //=========================================================
    connectedCallback() {
        console.log("CONNECTED");
        this.style.display = "none";

        this.observer.observe(
            document.body, {
                // attributes: true,
                subtree: true,
                childList: true
            }
        );

        this.register_consumers(document);
    }

    disconnectedCallback() {
    }

    elementsChanged(added_elements) {
        var self = this;

        added_elements.forEach(
            function(element) {
                self.register_consumers(element);
            }
        );
    }
}

customElements.define(
    pubsubMessageRouter.tagname.toLowerCase(),
    pubsubMessageRouter
);