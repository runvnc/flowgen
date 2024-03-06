module.exports = function(RED) {
  function FlowGenNode(config) {
    RED.nodes.createNode(this, config);
  }

  RED.nodes.registerType("flowgen", CustomSidebarNode);

  RED.httpAdmin.get("/custom-sidebar", function(req, res) {
    res.send(`
      <script>
        RED.sidebar.addTab({
          id: "custom-sidebar",
          label: "Custom Sidebar",
          icon: "fa fa-cog",
          content: '<button id="add-debug-node">Add Debug Node</button>'
        });

        document.getElementById("add-debug-node").addEventListener("click", function() {
          const workspace = RED.workspaces.active();
          const debugNode = {
            id: RED.nodes.id(),
            type: "debug",
            name: "Debug",
            active: true,
            console: "false",
            complete: "false",
            x: 100,
            y: 100,
            z: workspace.id,
            wires: []
          };
          RED.nodes.add(debugNode);
          RED.view.redraw();
        });
      </script>
    `);
  });
};
