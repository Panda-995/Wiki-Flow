"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/header";
import { useSession } from "next-auth/react";
import { 
  Network, Loader2, ZoomIn, ZoomOut, RotateCcw, Search, 
  FileText, FolderTree, Tag, Maximize2, Minimize2, MapPin, List
} from "lucide-react";
import Link from "next/link";

interface GraphNode {
  id: string;
  label: string;
  type: "post" | "category" | "tag";
  color?: string;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
}

export default function GraphPage() {
  const { data: session } = useSession();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fetchGraphData = useCallback(async () => {
    try {
      const res = await fetch("/api/graph");
      const data = await res.json();
      const fetchedNodes = data.nodes || [];
      const fetchedLinks = data.links || [];
      setLinks(fetchedLinks);
      const positionedNodes = initializeGraph(fetchedNodes);
      setNodes(positionedNodes);
    } catch (error) {
      console.error("Failed to fetch graph data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  const initializeGraph = (inputNodes: GraphNode[]): GraphNode[] => {
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 500;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    const categories = inputNodes.filter(n => n.type === "category");
    const tags = inputNodes.filter(n => n.type === "tag");
    const posts = inputNodes.filter(n => n.type === "post");

    categories.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / categories.length;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
    });

    tags.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / tags.length + Math.PI / 4;
      node.x = centerX + (radius * 0.6) * Math.cos(angle);
      node.y = centerY + (radius * 0.6) * Math.sin(angle);
    });

    posts.forEach((node) => {
      const angle = Math.random() * 2 * Math.PI;
      const r = radius * 0.3 + Math.random() * radius * 0.2;
      node.x = centerX + r * Math.cos(angle);
      node.y = centerY + r * Math.sin(angle);
    });

    return [...inputNodes];
  };

  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);

    links.forEach(link => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);
      
      if (sourceNode && targetNode && sourceNode.x && sourceNode.y && targetNode.x && targetNode.y) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    nodes.forEach(node => {
      if (!node.x || !node.y) return;

      const isSelected = selectedNode?.id === node.id;
      const isHighlighted = selectedNode && links.some(
        l => (l.source === selectedNode.id && l.target === node.id) ||
             (l.target === selectedNode.id && l.source === node.id)
      );

      const nodeRadius = isSelected ? 12 : isHighlighted ? 10 : 8;
      const nodeColor = node.color || getTypeColor(node.type);

      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected || isHighlighted ? nodeColor : `${nodeColor}80`;
      ctx.fill();

      if (isSelected || isHighlighted) {
        ctx.strokeStyle = nodeColor;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.fillStyle = "#333";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        node.label.length > 20 ? node.label.substring(0, 20) + "..." : node.label,
        node.x,
        node.y + nodeRadius + 16
      );
    });

    ctx.restore();
  }, [nodes, links, selectedNode, zoom]);

  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "post": return "#3b82f6";
      case "category": return "#10b981";
      case "tag": return "#f59e0b";
      default: return "#6b7280";
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = nodes.find(node => {
      if (!node.x || !node.y) return false;
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < 15;
    });

    setSelectedNode(clickedNode || null);
  };

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setSelectedNode(null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const filteredNodes = searchQuery
    ? nodes.filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : nodes;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          user={session?.user ? { name: session.user.name, email: session.user.email, image: session.user.image, role: (session.user as { role?: string }).role } : undefined}
          title="知识图谱"
          backHref="/"
          backLabel="返回首页"
        />
        <div className="container mx-auto py-8 px-4">
          <Card className="h-[500px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={session?.user ? { name: session.user.name, email: session.user.email, image: session.user.image, role: (session.user as { role?: string }).role } : undefined}
        title="知识图谱"
        backHref="/"
        backLabel="返回首页"
      />

      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <Card ref={containerRef} className="border-0 shadow-lg overflow-hidden">
          <div className="bg-muted/30 border-b p-4 flex items-center justify-between">
            <div className="flex gap-2">
              <Badge variant="outline" className="gap-2">
                <FileText className="h-3 w-3" />
                {nodes.filter(n => n.type === "post").length} 文章
              </Badge>
              <Badge variant="outline" className="gap-2">
                <FolderTree className="h-3 w-3" />
                {nodes.filter(n => n.type === "category").length} 分类
              </Badge>
              <Badge variant="outline" className="gap-2">
                <Tag className="h-3 w-3" />
                {nodes.filter(n => n.type === "tag").length} 标签
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleZoomOut} title="缩小">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="px-2 py-1 text-sm">{Math.round(zoom * 100)}%</span>
              <Button variant="outline" size="icon" onClick={handleZoomIn} title="放大">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleReset} title="重置">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={toggleFullscreen} title="全屏">
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <CardContent className="p-0">
            {nodes.length === 0 ? (
              <div className="h-[500px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Network className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">暂无图谱数据</p>
                  <p className="text-sm mt-2">创建一些文章后即可查看知识图谱</p>
                  <Link href="/posts/new">
                    <Button className="mt-4" size="sm">
                      创建文章
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={500}
                  className="w-full cursor-pointer"
                  onClick={handleCanvasClick}
                />
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <div className="bg-background/80 backdrop-blur-sm rounded-lg p-2 flex gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span>文章</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>分类</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span>标签</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                搜索节点
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索文章、分类或标签..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {selectedNode && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  选中节点
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="font-semibold">{selectedNode.label}</p>
                  <Badge 
                    variant="secondary"
                    style={{ 
                      backgroundColor: selectedNode.color ? `${selectedNode.color}20` : undefined,
                      color: selectedNode.color
                    }}
                  >
                    {selectedNode.type === "post" ? (
                      <><FileText className="h-3 w-3 mr-1" />文章</>
                    ) : selectedNode.type === "category" ? (
                      <><FolderTree className="h-3 w-3 mr-1" />分类</>
                    ) : (
                      <><Tag className="h-3 w-3 mr-1" />标签</>
                    )}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">关联关系</p>
                  <div className="space-y-1">
                    {links
                      .filter(l => l.source === selectedNode.id || l.target === selectedNode.id)
                      .map((link, idx) => {
                        const connectedId = link.source === selectedNode.id ? link.target : link.source;
                        const connectedNode = nodes.find(n => n.id === connectedId);
                        return connectedNode ? (
                          <div 
                            key={idx}
                            className="text-sm p-2 rounded hover:bg-muted cursor-pointer transition-colors"
                            onClick={() => setSelectedNode(connectedNode)}
                          >
                            <Badge variant="outline" className="text-xs">
                              {connectedNode.type === "post" ? (
                                <><FileText className="h-3 w-3 mr-1" />文章</>
                              ) : connectedNode.type === "category" ? (
                                <><FolderTree className="h-3 w-3 mr-1" />分类</>
                              ) : (
                                <><Tag className="h-3 w-3 mr-1" />标签</>
                              )}
                            </Badge>
                            <span className="ml-2">{connectedNode.label}</span>
                          </div>
                        ) : null;
                      })}
                  </div>
                </div>

                {selectedNode.type === "post" && (
                  <Link href={`/posts/${selectedNode.id}`}>
                    <Button className="w-full" size="sm">
                      查看文章
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <List className="h-5 w-5 text-primary" />
                节点列表
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredNodes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    未找到匹配的节点
                  </p>
                ) : (
                  filteredNodes.map((node) => (
                    <div
                      key={node.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedNode?.id === node.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted border-transparent"
                      } border`}
                      onClick={() => setSelectedNode(node)}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: node.color || getTypeColor(node.type) }}
                        />
                        <span className="text-sm font-medium flex-1 truncate">
                          {node.label}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}
