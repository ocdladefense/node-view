/**
 * The Router class locates the best route for a given path.
 * The route is a route object of structure representing a route object.
 * The path is a string, i.e., window.location.href.
 */

export default class Router {
    static routes = {};

    currentRoute = null;

    listenTo(event) {
        window.addEventListener(event, this);
        document.addEventListener("rerender", this);
    }

    async handleEvent(e) {
        //console.log("hash has changed");
        await this.render();
    }

    getComponent(route) {
        // Default props for use with the spread operator.
        let defp = {};

        return [Body, defp];
    }

    // match("ors-volume/1"); current scenario.
    match(url) {
        for (let r in Router.routes) {
            let [route, component] = Router.routers[r];

            let match = route.match(url);

            if (null === match) {
                continue;
            } else {
                // return the component call passing in matched parameters.
                return component(props); // props
            }
        }

        return NotFound;
    }
}
