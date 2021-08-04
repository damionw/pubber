class pubsubMessageRouter extends HTMLElement {
    static get tagname() {
        return "PUBSUB-ROUTER";
    }

    //=========================================================
    //                       Constructor
    //=========================================================
    constructor() {
        super();

        this._pubber_message_handler = null;
        this._observer = null;
        this.registrations = {};
        this.idcount = 0;
    }

    //=========================================================
    //                      Class Methods
    //=========================================================
    static get singleton() {
        var class_elements = document.getElementsByTagName(this.tagname);

        for (var i=0; i < class_elements.length; ++i) {
            return class_elements[i];
        }

        var body_elements = document.getElementsByTagName("BODY");

        for (var i=0; i < body_elements.length; ++i) {
            var parent_node = body_elements[i];
            var new_router_element = document.createElement(this.tagname);
            parent_node.appendChild(new_router_element);
            return new_router_element;
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
    register_consumers(root_element) {
        try {
            var selection = (root_element || document).querySelectorAll("*");
        }
        catch (TypeError) {
            return;
        }

        var elements = Array.from(selection);

        for (var i=0; i < elements.length; ++i) {
            var element = elements[i];

            if (element == null) {
                continue;
            }

            if (! element.getAttribute("subscribe")) {
                continue;
            }

            if (this.has_element_id(element)) {
                continue;
            }

            this.register_element(element);
        }
    }

    register_element(element) {
        var self = this;

        // Register topics
        this.get_element_topics(element).forEach(
            function(topic) {
                self.register_topic(element, topic);
            }
        );

        // Register event handler
        var code = element.getAttribute("listener");

        if (code == "" || code == "null") {
            element._pubber_message_handler = new Function("return;");
        }
        else if (window[code] != null) {
            element._pubber_message_handler = window[code];
        }
        else if (code.search(";") == -1) {
            element._pubber_message_handler = new Function("topic", "payload", code + ".call(this, topic, payload);");
        }
        else {
            element._pubber_message_handler = new Function("topic", "payload", code);
        }

        // Provide element with an emit() function
        if (element.emit == null) {
            element.emit = function(topic, payload) {
                self.broadcast(topic, payload);
            }
        }
    }

    deregister_element(element) {
        var registrations = Object.entries(this.registrations || {});
        var _element_id = this.get_element_id(element);

        for (var i = 0; i < registrations.length; ++i) {
            const [_topic, _topic_registrations] = registrations[i];

            if (_element_id in _topic_registrations) {
                this.deregister_topic(element, _topic);
            }
        }
    }

    register_topic(element, topic){
        var _element_id = this.get_element_id(element);
        var _registrations = this.registrations;

        if (_registrations[topic] == null) {
            _registrations[topic] = {};
        }

        _registrations[topic][_element_id] = element;
    }

    deregister_topic(element, topic) {
        var _element_id = this.get_element_id(element);
        var _registrations = this.registrations;

        if (_registrations[topic] == null) {
            return;
        }

        delete _registrations[topic][_element_id];
        
    }

    //=========================================================
    //                 Identity and Topics
    //=========================================================
    has_element_id(element) {
        return (! element._pubber_id in {null: 0, "": 0});
    }

    get_element_id(element) {
        if (! this.has_element_id(element)) {
            element._pubber_id = "pubsub_registration_" + this.idcount++;
        }

        return element._pubber_id;
    }

    get_element_topics(element) {
        return Array.from(
            new Set(
                (element.getAttribute("subscribe") || "").
                split(",").
                map(
                    function(term) {
                        return term.trim().toLowerCase();
                    }
                ).filter(
                    function(term) {
                        return (term.length > 0);
                    }
                )
            )
        );
    }

    //=========================================================
    //                    Publishing
    //=========================================================
    broadcast(topic, payload) {
        var topic = topic.toLowerCase();
        var registrations = Object.entries(this.registrations[topic] || {});

        for (var i = 0; i < registrations.length; ++i) {
            const [_id, _element] = registrations[i];

            if (_element == null) {
                continue;
            }

            if (_element._pubber_message_handler == null) {
                continue;
            }
           
            _element._pubber_message_handler.call(_element, topic, payload);
        }
    }

    // Convenience function mirrors what registered elements get
    emit(topic, payload) {
        this.broadcast(topic, payload);
    }

    //=========================================================
    //                    Event Handling
    //=========================================================
    connectedCallback() {
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
        for (var i = 0; i < added_elements.length; ++i) {
            this.register_consumers(added_elements[i]);
        }
    }
}

customElements.define(
    pubsubMessageRouter.tagname.toLowerCase(),
    pubsubMessageRouter
);