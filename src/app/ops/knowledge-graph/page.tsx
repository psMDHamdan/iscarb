"use client";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Database, Search, LayoutGrid, Network, Terminal } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const ForceGraph = dynamic(() => import("./ForceGraph"), { ssr: false });

interface CatalogResponse {
  "@context": any;
  "@id": string;
  "@type": string;
  "dcat:dataset": {
    "@type": string;
    "dcterms:title": string;
    "dcat:distribution": {
      "dcat:accessURL": string;
    }
  }[];
}

function parseJsonLdToGraph(jsonld: any) {
  const nodes: any[] = [];
  const links: any[] = [];
  const nodeSet = new Set<string>();

  function addNode(id: string, label: string, group: string) {
    if (!nodeSet.has(id)) {
      nodes.push({ id, name: label, group });
      nodeSet.add(id);
    }
  }

  function traverse(obj: any, parentId?: string, relName?: string) {
    if (!obj || typeof obj !== "object") return;
    
    if (Array.isArray(obj)) {
      obj.forEach(o => traverse(o, parentId, relName));
      return;
    }

    const id = obj["@id"] || obj.id || `node-${Math.random()}`;
    const type = obj["@type"] || obj.type || "Object";
    const name = obj.hasName || obj.name || obj.title || obj.hasCourseCode || id.split("/").pop();

    addNode(id, String(name), type);

    if (parentId && relName) {
      const cleanRelName = relName.replace(/^iscarb:/, '').replace(/^iscarb-[a-z]+:/, '');
      links.push({ source: parentId, target: id, label: cleanRelName });
    }

    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith("@") || key === "id" || key === "type" || key === "hasName") continue;

      if (typeof value === "object" && value !== null) {
        traverse(value, id, key);
      } else {
        const litId = `lit-${Math.random()}`;
        const cleanKey = key.replace(/^iscarb:/, '').replace(/^iscarb-[a-z]+:/, '');
        // For Literals, use the value as the label
        addNode(litId, String(value), "Literal");
        links.push({ source: id, target: litId, label: cleanKey });
      }
    }
  }

  traverse(jsonld);
  return { nodes, links };
}

export default function OpsKnowledgeGraphPage() {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Set default ID for Student to Hamdan Al-Otaibi
  const [entityIds, setEntityIds] = useState<Record<string, string>>({
    "student": "cms2xchok0001onb561k9kpdf"
  });
  
  const [graphData, setGraphData] = useState<any>(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState("");

  const [sparqlQuery, setSparqlQuery] = useState("SELECT * WHERE { ?s ?p ?o } LIMIT 10");
  const [sparqlResult, setSparqlResult] = useState<any>(null);
  const [sparqlLoading, setSparqlLoading] = useState(false);

  useEffect(() => {
    fetch("/api/rdf/catalog")
      .then(async (res) => {
        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/")) {
          return res.json();
        }
        return null;
      })
      .then((catalogData) => {
        if (catalogData) {
          setCatalog(catalogData);
          const studentDataset = catalogData["dcat:dataset"]?.find((d: any) => d["dcterms:title"].toLowerCase() === "student");
          if (studentDataset) {
            handleVisualize(studentDataset["dcat:distribution"]["dcat:accessURL"], "student");
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load catalog:", err);
        setLoading(false);
      });
  }, []);

  const handleIdChange = (type: string, value: string) => {
    setEntityIds(prev => ({ ...prev, [type]: value }));
  };

  const handleVisualize = async (accessUrl: string, type: string) => {
    const id = entityIds[type.toLowerCase()] || entityIds[type];
    if (!id) return;
    
    setGraphError("");
    setGraphLoading(true);
    // Append ?expand=true to get the deep graph!
    const url = accessUrl.replace("[id]", id) + "?expand=true";
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Entity not found");
      const jsonld = await res.json();
      setGraphData(parseJsonLdToGraph(jsonld));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      setGraphError(error.message);
    } finally {
      setGraphLoading(false);
    }
  };

  const handleRunSparql = async () => {
    setSparqlLoading(true);
    setSparqlResult(null);
    try {
      const res = await fetch("/api/rdf/sparql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: sparqlQuery })
      });
      const data = await res.json();
      setSparqlResult(data);
    } catch (e: any) {
      setSparqlResult({ error: e.message });
    } finally {
      setSparqlLoading(false);
    }
  };

  const datasets = catalog?.["dcat:dataset"] || [];
  const filteredDatasets = datasets.filter(d => 
    d["dcterms:title"].toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader title="Knowledge Graph Explorer" description="Interactive Semantic Directory & Triple Store" />
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/api/rdf/ontology" target="_blank">
              <Database className="w-4 h-4 mr-2" />
              View Ontology
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/api/rdf/catalog" target="_blank">
              <LayoutGrid className="w-4 h-4 mr-2" />
              Raw Catalog
            </Link>
          </Button>
        </div>
      </div>

      {graphData && (
        <Card className="border-primary shadow-sm">
          <CardHeader className="bg-primary/5 pb-4 border-b">
            <CardTitle className="flex justify-between items-center text-lg">
              <span className="flex items-center gap-2"><Network className="w-5 h-5 text-primary"/> Entity Visualizer</span>
              <Button size="sm" variant="ghost" onClick={() => setGraphData(null)}>Close</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ForceGraph data={graphData} />
          </CardContent>
        </Card>
      )}

      {graphError && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg font-medium">
          Error loading graph: {graphError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">API Directory</h2>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search entities (e.g. Student)..." 
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse border rounded-xl">
              Loading catalog...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDatasets.map((dataset, idx) => {
                const title = dataset["dcterms:title"];
                const accessUrl = dataset["dcat:distribution"]["dcat:accessURL"];
                
                return (
                  <Card key={idx} className="flex flex-col">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        {title}
                        <Database className="w-3.5 h-3.5 text-muted-foreground opacity-50" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="mt-auto space-y-3">
                      <div className="flex flex-col gap-2">
                        <Input 
                          placeholder="Entity ID..." 
                          className="h-8 text-sm"
                          value={entityIds[title] || ""}
                          onChange={(e) => handleIdChange(title, e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="secondary"
                            className="h-8 flex-1"
                            onClick={() => handleVisualize(accessUrl, title)}
                            disabled={!entityIds[title] || graphLoading}
                          >
                            <Network className="w-3.5 h-3.5 mr-1.5" />
                            Visualize
                          </Button>
                          <Button 
                            asChild
                            size="sm" 
                            className="h-8 flex-1"
                            disabled={!entityIds[title]}
                          >
                            <Link href={entityIds[title] ? accessUrl.replace("[id]", entityIds[title]) : "#"} target="_blank">
                              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                              JSON-LD
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          
          {!loading && filteredDatasets.length === 0 && (
            <div className="p-12 text-center text-muted-foreground border border-dashed rounded-xl">
              No entities found matching "{search}"
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Triple Store Validator
          </h2>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Live SPARQL Query (Fuseki)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                className="font-mono text-sm min-h-[150px] bg-muted/50"
                value={sparqlQuery}
                onChange={e => setSparqlQuery(e.target.value)}
              />
              <Button onClick={handleRunSparql} className="w-full" disabled={sparqlLoading}>
                {sparqlLoading ? "Running..." : "Run Query"}
              </Button>

              {sparqlResult && (
                <div className="mt-4 p-3 bg-black text-green-400 font-mono text-xs rounded-md overflow-x-auto max-h-[300px] overflow-y-auto">
                  <pre>{JSON.stringify(sparqlResult, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
